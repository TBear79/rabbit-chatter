//Not quite unit tests as they depend on RabbitMq to be installed

//REQUIREMENTS:
//npm install in test-dir
//RabbitMq installed locally
//Mocha

'use strict'

const expect = require('chai').expect;
const sinon = require('sinon');
const amqplib = require('amqplib');

const rabbitChatter = require('../lib/rabbit-chatter.js');

describe('RabbitMq connection', () => {

	describe('Test if messages are emitted to the exchange', function () {
		this.timeout(10000);

		const queueName = '';
		const isQueueExclusive = true;

		const options = {
			appId: 'TESTAPPIDALL',
			protocol: 'amqp',
			username: 'guest',
			password: 'guest',
			host: 'localhost',
			port: 5672,
			virtualHost: "%2f",
			silent: true,
			exchangeName: 'TEST',
			exchangeType: 'topic',
			routingKey: '',
			durable: false,
			timeout: 1000
		}

		const connect = (timeout) => {
			return amqplib
				.connect(`${options.protocol}://${options.username}:${options.password}@${options.host}:${options.port}/${options.virtualHost}`)
				.then((conn) => {
					setTimeout(() => {
						connection.close();
					}, timeout);
					connection = conn;
					return conn.createChannel();
				})
				.then((channel) => {
					channel.assertExchange(options.exchangeName, options.exchangeType, { durable: options.durable })
						.then(() => {
							channel.assertQueue(queueName, { exclusive: isQueueExclusive })
								.then((q) => {
									channel.bindQueue(q.queue, options.exchangeName, '');
								});
						})
						.catch((ex) => { throw ex; });
					return channel;
				});
		}

		const subscribe = (channel, handler) => {
			return channel.consume(queueName, (msg) => { handler(msg); }, { noAck: true });
		};

		let rabbit;
		let connection;
		let msgCount;

		beforeEach(function () {
			msgCount = 0;
			rabbit = rabbitChatter.rabbit(options);
		});

		afterEach(function () {
			rabbit = null;
			connection = null;
		});

		it('should return the correct message from queue', (done) => {
			let message;
			const testContent = 'TESTING 123';
			const testCorrelationId = 'CORRELATIONIDTEST';

			setTimeout(() => {
				rabbit.chat(testContent, { correlationId: testCorrelationId });
			}, options.timeout / 2);

			connect(1000)
				.then((channel) => {
					subscribe(channel, (msg) => {
						msgCount++;
						message = msg;
					});

					connection.on('close', () => {
						expect(message.content.toString()).to.equal(testContent);
						expect(message.properties.appId).to.equal(options.appId);
						expect(message.properties.correlationId).to.equal(testCorrelationId);
						expect(msgCount).to.equal(1);
						done();
					});
				});

		});

		it('should send 20 messages and receive them all', (done) => {
			const numberOfMessages = 20;

			setTimeout(() => {
				for (let i = 0; i < numberOfMessages; i++) {
					rabbit.chat("TESTING");
				}
			}, options.timeout / 20);

			connect(1000)
				.then((channel) => {
					subscribe(channel, (msg) => {
						msgCount++;
					});

					connection.on('close', () => {
						expect(msgCount).to.equal(numberOfMessages);
						done();
					});
				});

		});

		it('should send sporadic messages and receive them all', (done) => {
			let timer;
			let counter = 0;
			const maxTimeout = 1300;
			const numberOfMessages = 5;

			const repeater = () => {
				const getNextInterval = () => {
					const rand = Math.random();
					const interval = (rand === 0 ? 0.1 : rand) * maxTimeout;
					return interval;
				};

				if (timer) {
					clearInterval(timer);

					if (numberOfMessages === counter) {
						return;
					}
				}

				timer = setInterval(() => {
					rabbit.chat("TESTING");
					counter++;
					repeater();
				}, getNextInterval());
			};

			repeater();

			connect(maxTimeout * numberOfMessages)
				.then((channel) => {
					subscribe(channel, (msg) => {
						msgCount++;
					});

					connection.on('close', () => {
						expect(msgCount).to.equal(numberOfMessages);
						done();
					});
				});

		});

	});

});
