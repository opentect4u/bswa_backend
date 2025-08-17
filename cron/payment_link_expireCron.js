const dateFormat = require('dateformat');
const { db_Select } = require('../modules/MasterModule');

const expirePaymentLinks = async () => {
    try {
        const curr_dt_time = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');

        // 1. Fetch all members with expired payment links

        var select = "member_id",
        table_name = "md_member",
        whr = `memb_status = 'T' 
               AND pay_status = 'P' 
               AND link_expiry_time < '${curr_dt_time}'`;
        order = null;
        const members = await db_Select(select, table_name, whr, order);

        if (members.suc > 0 && members.msg.length > 0) {
            for (let memb of members.msg) {
                // 2. Update pay_status to 'E'

                var table_name = "md-member",
                fields = `pay_status = 'E'`,
                values = null,
                whr = `member_id = ${memb.member_id}`,
                flag = 1; 
                const upd_res = await db_Insert(table_name, fields, values, whr, flag);

                if (upd_res.suc > 0) {
                    console.log(`✅ Payment link expired for member_id: ${memb.member_id}`);
                }
            }
        } else {
            console.log("No expired payment links found.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error expiring payment links:", error);
        process.exit(1);
    }
};

expirePaymentLinks();
