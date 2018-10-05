'use strict'

const amqplib = require('amqplib');
const uuid = require('uuid');
const dontCollide = require('dont-collide');

class ErrorHelper {
    static defaultError(ex) {
        console.error('ERROR in rabbit-chatter:', ex.stack);
    }
}

class RabbitChatter {
    constructor(options) {

        if (!options)
            options = {};

        this.appId = options.appId;
        this.handleError = options.handleError || ErrorHelper.defaultError;
        this.silent = options.silent || false;
        this.timeout = options.timeout || 1000;

        const protocol = options.protocol || 'amqp';
        const username = options.username || 'guest';
        const password = encodeURIComponent(options.password) || 'guest';
        const host = options.host || 'localhost';
        const virtualHost = options.virtualHost ? '/' + options.virtualHost : '';
        const port = options.port || 5672;

        this.amqp = {};
        this.amqp.host = `${protocol}://${username}:${password}@${host}:${port}${virtualHost}`;

        this.amqp.exchangeType = options.exchangeType || 'topic';
        this.amqp.exchangeName = options.exchangeName || '';
        this.amqp.routingKey = options.routingKey || '';
        this.amqp.durable = options.durable || false;

        this._connectionPool = [];
        this._dc = dontCollide();

        this._sendMessageToQueue = (msg, properties, callback) => {
            this._getConnectionChannel()
                .then((channel) => {
                    return channel.assertExchange(this.amqp.exchangeName, this.amqp.exchangeType, { durable: this.amqp.durable })
                        .then((ok) => {
                            return new Promise((resolve, reject) => {
                                if (!ok) return reject();
                                this._resetTimeout(channel.connection);
                                const publish = channel && channel.publish(this.amqp.exchangeName, this.amqp.routingKey, new Buffer(msg), properties);
                                if (!this.silent && publish) console.log("Message send from rabbit-chat: %s", msg);
                                callback(channel);
                                return resolve(publish);
                            })
                        });
                })
                .catch(this.handleError);
        };

        this._getConnectionChannel = () => {
            if (this._connectionPool.length) {
                return new Promise((resolve, _) => {
                    const activeConnection = this._connectionPool.filter((conn) => !conn.closing)[0];

                    if (!activeConnection) return resolve(this._createNewConnectionChannel());

                    this._resetTimeout(activeConnection);

                    const activeChannel = this._getActiveChannel(activeConnection);

                    if (!activeChannel) this._close(activeConnection);

                    resolve(activeChannel || this._createNewConnectionChannel());
                });
            } else {
                return this._createNewConnectionChannel();
            }
        };

        this._createNewConnectionChannel = () => {
            return amqplib
                .connect(this.amqp.host)
                .then((conn) => {
                    conn.connection.timeout = this._setTimeout(conn.connection);
                    this._connectionPool.push(conn.connection);
                    return conn.createChannel();
                })
        };

        this._setTimeout = (connection) => {
            return setTimeout(() => {
                this._close(connection);
            }, this.timeout);
        };

        this._close = (connection) => {
            connection.closing = true;
            this._connectionPool.splice(this._connectionPool.indexOf(connection), 1);

            const activeChannel = this._getActiveChannel(connection);
            if (activeChannel) {
                activeChannel.close()
                    .then(() => connection.close());
            } else {
                connection.close();
            }
        };

        this._getActiveChannel = (connection) => {
            // channels[1] is the actual channel
            return connection &&
                connection.channels &&
                connection.channels.length > 1 &&
                connection.channels[1].channel;
        };

        this._resetTimeout = (connection) => {
            clearTimeout(connection.timeout);
            connection.closing = false;
            connection.timeout = this._setTimeout(connection);
        }
    }

    static rabbit(options) {
        return new RabbitChatter(options);
    }

    chat(msg, properties, callback) {
        properties = properties || {};
        properties.appId = properties.appId || this.appId;
        properties.correlationId = properties.correlationId || uuid.v4();
        properties.timestamp = properties.timestamp || Date.now();

        callback = callback || (() => { });

        this._dc.throttle(this._sendMessageToQueue, msg, properties, callback);
    }
}

module.exports = RabbitChatter;
