module.exports = (sequelize, Sequelize) => {
    const Customer = sequelize.define('customer', {
        customer_id: {
            primaryKey: true,
            type: Sequelize.UUID,
        },
        first_name: {
            type: Sequelize.STRING
        },
        identification: {
            type: Sequelize.STRING
        }
    },{
        schema: 'public',
        freezeTableName:  true,
        underscored: true,
        timestamps: false
    })

    return Customer
}