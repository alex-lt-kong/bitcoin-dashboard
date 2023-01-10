const
    configs = {
        kafka: {
            KafkaConfig: {
                clientId: 'my-app',
                brokers: ['localhost:9092'],
                retry: {
                    initialRetryTime: 1000,
                    maxRetryTime: 600000,
                    retries: 72
                }
            },
            topic: 'my-topic',
            enc_key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
        },
        port: 12345,
        ssl: {
            key: '/etc/ssl/my-cert.key',
            crt: '/etc/ssl/my-cert.crt'
        },
        weatherData: {
            primary: {
                key: '',
                lat: '3.141',
                lon: '1.414',
                lang: 'en',
                unit: 'metric',
                locationLabel: 'Hong Kong'
            },
            secondary: {
                key: '',
                lat: '2.718',
                lon: '0.11235',
                lang: 'en',
                unit: 'metric',
                locationLabel: 'New York'
            }
        }
    };

module.exports = {
    configs
};