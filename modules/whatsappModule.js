const axios = require('axios'),
dotenv = require("dotenv");
dotenv.config({ path: `.env.prod` });

module.exports = {
    sendWappMsg: (phone, msg) => {
        phone = phone.length == 10 ? `91${phone}` : phone
        return new Promise((resolve, reject) => {
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://new.xtalkz.in/api/send?number=${phone}&type=text&message=${encodeURIComponent(msg)}&instance_id=${process.env.WHATSAPP_INSTANCE_ID}&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`,
                headers: {}
            };

            // console.log(config);

            axios.request(config)
                .then((response) => {
                    console.log(JSON.stringify(response.data));
                    resolve(resolve)
                })
                .catch((error) => {
                    console.log(error);
                    reject(error)
                });
        })
    }
}