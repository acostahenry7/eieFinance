module.exports = (sequelize, Sequelize) => {
    const Amortization = sequelize.define('amortization', {
        amortization_id: {
            primaryKey: true, 
            type: Sequelize.STRING,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false
        },
        last_modified_by: {
            type: Sequelize.STRING
        },
        paid: {
            type: Sequelize.BOOLEAN
        },
        status_type: {
            type: Sequelize.STRING
        },
        total_paid: {
            type: Sequelize.STRING
        }
    },{
        schema: 'public',
        freezeTableName:  true,
        underscored: true,
        timestamps: false
    })

    return Amortization
}