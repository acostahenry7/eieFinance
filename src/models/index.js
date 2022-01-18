const { Sequelize } = require('sequelize')
const config = require('../server/dbconfig.js')


const sequelize = new Sequelize(
    config.db,
    config.user,
    config.password,
    {
        host: config.host,
        dialect: config.dialect,
        operatorsAliases: false,
        
        pool: {
            max: config.pool.max,
            min: config.pool.min,
            acquire: config.pool.acquire,
            idle: config.pool.idle
        }
    }
)

const db ={}

db.Sequelize = Sequelize
db.sequelize = sequelize

db.customer = require('../models/customer.model')(sequelize, Sequelize)
db.loanApplication = require('../models/LoanApplication.model')(sequelize, Sequelize)
db.payment = require('./Payment.model')(sequelize, Sequelize)
db.paymentDetail = require('../models/PaymentDetail.model')(sequelize, Sequelize)
db.register = require('./Register.model')(sequelize, Sequelize)
db.user = require('../models/user.model')(sequelize, Sequelize)
db.receipt = require('./Receipt.model')(sequelize, Sequelize)
db.amortization = require('../models/Amortization.model')(sequelize, Sequelize)

db.loanApplication.belongsTo(db.customer,{
    foreignKey: 'customer_id'
})
db.customer.hasOne(db.loanApplication,{
    foreignKey: 'customer_id'
})

module.exports = db
