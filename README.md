# rabbit-chatter

A message emitter for RabbitMQ. 

Non-blocking as it closes the connection after every message, but keeps the connection open as long as new messages arrive within a short timespan.

* Easy to use and fast to implement
* Stable
* Very few dependencies
* Build upon [amqplib](https://www.npmjs.com/package/amqplib)

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
	npm install rabbit-chatter
```

Then use `require()` to load it in your code:

```javascript
	var rabbitChatter = require('rabbit-chatter');
```

Initialize a new instance:

```javascript
	var rabbit = rabbitChatter.rabbit(options);
```

And then you can send you message:

```javascript
	rabbit.chat('Got any carots?');
```

That's it! Of course you need to have RabbitMQ up and running for this to work.

If you haven't, I'll just provide a link to their homepage as a service to you: [RabbitMQ](https://www.rabbitmq.com/).

## Options

You can of course provide options for setting up the transport in amqplib and for some extra stuff in rabbit-chatter.

### appId

String

Default: ''

A name for the application sends the message. Used in the receiving application to identify where the message came from.


### handleError

Function

Default: See below

A function for handling errors if it fails when sending the log to the queue.

The default function looks like this:
```javascript
	function(ex) {
		console.log('ERROR in rabbit-chatter: ' + util.inspect(ex, { depth: null }));
	}
```


### silent

Boolean

Default: false

If true, console-messages from winston-fast-rabbitmq will be suppressed. 


### protocol

String

Default: 'amqp'

The protocol used to communicate with RabbitMQ (or perhaps another message queue?).


### host

String

Default: 'localhost'

The URI of the server that hosts the RabbitMQ.


### virtualHost

String

Default: ''

Used if RabbitMQ is configured with a virtual host.


### port

Number

Default: 5672

The port that is open for connections to RabbitMQ.

### username

String

Default: 'guest'

Use this if credentials is required.


### password

String

Default: 'guest'

Use this if credentials is required.


### exchangeType

String

Default: 'topic'

The topic for the exchange.


### exchangeName

String

Default: 'winstonLog'

The name of the exchange.


# Sending properties

It is possible to send properties along with the message. They are build into amqplib so you can get more knowledge here: [amqplib publish properties](http://www.squaremobius.net/amqp.node/channel_api.html#channel-publish)

That being said, rabbit-chatter sets some defaults in order to make things a bit easier.

### appId

String

Default: appId set on the instanciation.

The name of the sending application.


### correlationId

String

Default: a guid generated by node-uuid.

A guid for the recieving application to respond to.


### timestamp

Number

Default: milliseconds elapsed since 1 January 1970 00:00:00 UTC set with date.now()


# Tests

To run tests on this module, make sure that the modules for the tests are installed

```
	npm install rabbit-chatter --dev
```

Then run:

```
	npm test
```

NOTICE: The test is not unit test but tests the functionality for submitting to RabbitMQ. So RabbitMQ is required to be installed locally in order to run the tests.

In one of the tests, 1000 messages are send to, and returned from, the queue . It runs in about 12 seconds so don't be nervous if it seems to stall for a while.

#Futher reading

Further documentation the topics according to this module:

* [RabbitMQ](https://www.rabbitmq.com/documentation.html) [Tutorial](https://www.rabbitmq.com/getstarted.html)
* [amqplib](https://www.npmjs.com/package/amqplib)

#Keywords

* rabbitmq
* amqp
* amqplib
* message queue
* service bus

# License

The MIT License (MIT)

Copyright (c) 2016 Thorbjørn Gliese Jelgren (The Right Foot, www.therightfoot.dk)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

