const express = require('express');
const Config = require('./conf');
const mongodbConnection = require('./db/mongo');
const createChannel = require('./db/rabbitmq');
const MutantModel = require('./models/mutant.model');

const startConsumer = async ({ port, databases }) => {
    const { mongo, rabbitmq } = databases;

    await mongodbConnection(mongo);

    const { channel, channelName } = await createChannel(rabbitmq);

    channel.consume(channelName, async(data) => {
        try {
            if (data) {
                const doc = JSON.parse(Buffer.from(data.content));
                channel.ack(data);

                const created = await MutantModel.create(doc);
                if (created) {
                    console.log('DNA was saved successfully');
                }
            }
        } catch (err) {
            console.log(err);
        }
    });

    const app = express();

    app.listen(port, () => {
        console.log(`Server at ${port}`);
    });
}

startConsumer(Config);