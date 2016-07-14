//Not quite unit tests as they depend on RabbitMq to be installed

//REQUIREMENTS:
//npm install in test-dir
//RabbitMq installed locally
//Mocha

'use strict'

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');
const amqplib = require('amqplib');

const rabbitChatter = require('../lib/rabbit-chatter.js');

describe('RabbitMq connection', () => {
	describe('Test if messages are emittet to the exchange', function() {
		this.timeout(30000);

		const testAppId1 = 'TESTAPPIDALL';

		const options = { 
			appId: testAppId1,
			protocol: 'amqp',
			username: 'guest',
			password: 'guest',
			host: 'localhost',
			port: 5672,
			silent: true,
			host: 'localhost',
			exchangeName: 'TEST',
			exchangeType: 'topic',
			durable: false
		}

		
		const rabbit = rabbitChatter.rabbit(options);

		before(function () { 
		});
		after(function () { 
		});

		it('should return the correct message from queue',  (done) => {
			let connection; 
			let connectionCloseTimerId;
			const testContent = 'TESTING 123';
			const testCorrelationId = 'CORRELATIONIDTEST';
			
			let msgCount = 0;

			setTimeout(() => { rabbit.chat(testContent, { correlationId: testCorrelationId }); }, 50);

			return amqplib
				 .connect(options.protocol + '://' + options.host)
				.then((conn) => { connection = conn; return conn.createChannel(); })
				.then((channel) => {
					return channel.assertExchange(options.exchangeName, options.exchangeType, {durable: options.durable})
						.then((ok) => {
							return channel.assertQueue('', {exclusive: true})
					    				.then((q) => {
					    					channel.bindQueue(q.queue, options.exchangeName, '');

					    					return channel.consume(q.queue, (msg) => {
					    						
					    						msgCount++;

					    						clearTimeout(connectionCloseTimerId);

										        connectionCloseTimerId = setTimeout(() => { 
										        	expect(msg.content.toString()).to.equal(testContent);
													expect(msg.properties.appId).to.equal(testAppId1);
													expect(msg.properties.correlationId).to.equal(testCorrelationId);
										        	expect(msgCount).to.equal(1);
										        	
										        	connection.close(); 

										        	done();
										        }, 500);

										    }, {noAck: true});
					    				})

					  	});
				})
				.catch((ex) => { throw ex; });

			
			
		});

		
		it('should send 1000 messages and receive them all',  (done) => {

			const numberOfMessagesToSend = 1000;

			let connection; 
			let connectionCloseTimerId;
			let msgCount = 0;

			setTimeout(() => { 
				for(let i = 0; i < numberOfMessagesToSend; i++){
					rabbit.chat("TESTING"); 
				}				
			}, 500);

			return amqplib
				 .connect(options.protocol + '://' + options.host)
				.then((conn) => { connection = conn; return conn.createChannel(); })
				.then((channel) => {
					return channel.assertExchange(options.exchangeName, options.exchangeType, {durable: options.durable})
						.then((ok) => {
							return channel.assertQueue('', {exclusive: true})
					    				.then((q) => {
					    					channel.bindQueue(q.queue, options.exchangeName, '');

					    					return channel.consume(q.queue, (msg) => {
					    						
					    						msgCount++;

					    						clearTimeout(connectionCloseTimerId);

										        connectionCloseTimerId = setTimeout(() => { 
										        	expect(msgCount).to.equal(numberOfMessagesToSend);
										        	
										        	connection.close(); 

										        	done();
										        }, 500);

										    }, {noAck: true});
					    				})

					  	});
				})
				.catch((ex) => { throw ex; });
		});


	});
});

