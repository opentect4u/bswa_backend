const express = require('express');
const { checkedToken } = require('../../middleware/ApiAuthChecked.middleware');
const { save_general, save_life, save_asso, show_data } = require('../../modules/admin_feeModule');
const admin_fee_typeRouter = express.Router();

admin_fee_typeRouter.post('/gen_mem_save',checkedToken,save_general);
admin_fee_typeRouter.post('/life_mem_save',checkedToken,save_life);
admin_fee_typeRouter.post('/asso_mem_save',checkedToken,save_asso);
admin_fee_typeRouter.get('/get_data',checkedToken,show_data);


module.exports = {admin_fee_typeRouter}