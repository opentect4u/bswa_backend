const axios = require('axios'),
dotenv = require("dotenv");
dotenv.config({ path: `.env.prod` });

// module.exports = {
//     sendWappMsg: (phone, msg) => {
//         phone = phone.toString().length == 10 ? `91${phone}` : phone
//         // console.log(phone, 'asassa', phone.length);
//         return new Promise((resolve, reject) => {
//             let config = {
//                 method: 'get',
//                 maxBodyLength: Infinity,
//                 url: `https://new.xtalkz.in/api/send?number=${phone}&type=text&message=${encodeURIComponent(msg)}&instance_id=${process.env.WHATSAPP_INSTANCE_ID}&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 headers: {}
//             };

//             // console.log(config);

//             axios.request(config)
//                 .then((response) => {
//                     // console.log(JSON.stringify(response.data));
//                     resolve(JSON.stringify(response.data))
//                 })
//                 .catch((error) => {
//                     console.log(error);
//                     reject(error)
//                 });
//         })
//     },
//     sendWappMediaMsg: (phone, msg, mediaUrl, fileName) => {
//         phone = phone.toString().length == 10 ? `91${phone}` : phone
//         // console.log(phone, 'asassa', phone.length);
//         return new Promise((resolve, reject) => {
//             let config = {
//                 method: 'get',
//                 maxBodyLength: Infinity,
//                 url: `https://new.xtalkz.in/api/send?number=${phone}&type=media&message=${encodeURIComponent(msg)}&media_url=${mediaUrl}&filename=${fileName}&instance_id=${process.env.WHATSAPP_INSTANCE_ID}&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 headers: {}
//             };

//             // console.log(config);

//             axios.request(config)
//                 .then((response) => {
//                     // console.log(JSON.stringify(response.data));
//                     resolve(JSON.stringify(response.data))
//                 })
//                 .catch((error) => {
//                     console.log(error);
//                     reject(error)
//                 });
//         })
//     }
// }

module.exports = {
    sendWappMsg: (phone, msg) => {
        phone = phone.toString().length == 10 ? `91${phone}` : phone
        // console.log(phone, 'asassa', phone.length);
        return new Promise((resolve, reject) => {
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                //url: `https://new.xtalkz.in/api/send?number=${phone}&type=text&message=${encodeURIComponent(msg)}&instance_id=${process.env.WHATSAPP_INSTANCE_ID}&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`,
				 url: `http://148.251.129.118/wapp/api/send?apikey=${process.env.API_KEY}&mobile=${phone}&msg=${encodeURIComponent(msg)}`,
                headers: {}
            };

            // console.log(config);

            axios.request(config)
                .then((response) => {
                    // console.log(JSON.stringify(response.data));
                    resolve(JSON.stringify(response.data))
                })
                .catch((error) => {
                    console.log(error);
                    reject(error)
                });
        })
    },
    sendWappMediaMsg: (phone, msg, mediaUrl, fileName) => {
        phone = phone.toString().length == 10 ? `91${phone}` : phone
        // console.log(phone, 'asassa', phone.length);
        return new Promise((resolve, reject) => {
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://new.xtalkz.in/api/send?number=${phone}&type=media&message=${encodeURIComponent(msg)}&media_url=${mediaUrl}&filename=${fileName}&instance_id=${process.env.WHATSAPP_INSTANCE_ID}&access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`,
                headers: {}
            };

            // console.log(config);

            axios.request(config)
                .then((response) => {
                    // console.log(JSON.stringify(response.data));
                    resolve(JSON.stringify(response.data))
                })
                .catch((error) => {
                    console.log(error);
                    reject(error)
                });
        })
    }
}