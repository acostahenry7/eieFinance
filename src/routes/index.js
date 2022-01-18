const _ = require('lodash')
const express =  require('express')
const router = express.Router()


const db = require('../models/index')
const { user, password } = require('../server/dbconfig')
const Customer = db.customer
const Register = db.register
const Receipt = db.receipt
const User = db.user
const Amortization = db.amortization
const Payment = db.payment
const PaymentDetail = db.paymentDetail
const LoanApplication = db.loanApplication
const Sequelize = db.Sequelize
const Op = db.Sequelize

const bcrypt = require('bcryptjs')
const { receipt, paymentDetail } = require('../models/index')


module.exports = app => {

    const results = {}

    router.post('/login' , async(req, res) => {

        console.log(req.body);
        
        User.findOne(
            {   attributes: [
                    'user_id',
                    'login',
                    'password_hash',
                    'first_name',
                    'last_name',
                    'employee_id',
                    'outlet_id'
                ],
                where: {
                    login: req.body.username
                }
            }
        ).then( user => {
            if (user){
                            
                bcrypt.compare(req.body.password, user.password_hash).then(success =>  {
                        
                    if (success == false) {
                        results.successfullLogin = false

                    }else {
                        results.successfullLogin = true
                        results.userData = user
                    }
                
                    res.send(results)
                        //results.success = success 
                })
            } else {
                res.send(undefined)
            }
             
        })
    })


    router.get('/customers/main/:employeeId', async(req, res) => {

        if(!req.query.offset){
            req.query.offset = 1
        }

        if(!req.query.limit){
            req.query.limit=100
        }

        var offset = parseInt(req.query.offset)
        var limit = parseInt(req.query.limit)

        
        const startIndex = (offset - 1) * limit
        const endIndex = offset * limit


        const [data, meta] = await db.sequelize.query(
            
            
            `SELECT DISTINCT(la.customer_id) AS customer_id, c.first_name,last_name, identification, street, loan_situation
            FROM loan_application la
            JOIN customer c on (c.customer_id = la.customer_id)
            join loan l on (la.loan_application_id = l.loan_application_id)
            join loan_payment_address lp on (lp.loan_id = l.loan_id)
            where lp.section_id in 	(select cast(section_id as int) 
									from zone_neighbor_hood 
									where zone_id in (select zone_id
													  from employee_zone
													  where employee_id='${req.params.employeeId}') )	
			and la.outlet_id=(select outlet_id from employee where employee_id='${req.params.employeeId}')`

            // `SELECT DISTINCT(la.customer_id) AS customer_id, c.first_name, last_name, identification, street
            // FROM loan_application la 
            // JOIN customer c on (c.customer_id = la.customer_id) LIMIT 50`
            
            )




            const results   = {}

            if (endIndex < data.length){
                var nextOffset = offset + 1
                results.next = `http://10.0.0.5:3000/customers/main/${req.params.employeeId}?limit=${limit}&offset=${nextOffset}` 
            }

            if (startIndex > 0 ){
                results.previous = {
                    offset: offset - 1,
                    limit: limit
                }
            }

            
            results.customers = data.slice(startIndex, endIndex)

            results.loans = []

            data.find((item, index) =>  {
            
                console.log(data[index]);
                item.loan_situation == 'ARREARS' ? results.loans.push(data[index]) : '';
                 
             })

            key='customer_id'

            console.log(results.loans);

            results.customers = [...new Map(results.customers.map(item =>
            [item[key], item])).values()];
              
            //console.log(results);
              
              //results.results.push()

            
            
            

                /*const [loans, metadata] = await db.sequelize.query(`select * from loan 
                                                            where loan_application_id in (select loan_application_id 
                                                            from loan_application
                                                            where customer_id = '${results.results.customer_id}')`)*/

            //console.log(loans)                              
            

            //console.log(results);
                
            res.send(results)

    })


    
    router.get('/customers/each/:id', async(req, res) => {
        console.log(req.params.id);
        const results = {}

        const [customer, metadata] = await db.sequelize.query(
            `SELECT customer_id as key, identification, first_name, last_name, birth_date, email, p.name as province, m.name as municipality, s.name as section, street, street2, phone, mobile, status_type
			from customer c
			join province p on (p.province_id = c.province_id)
			join municipality m on (m.municipality_id = c.municipality_id)
			join section s on (s.section_id = c.section_id)
			where customer_id = '${req.params.id}'`
        )

        /*SELECT customer_id as key, first_name, last_name, birth_date, email, p.name, m.name, s.section_id, street, street2, phone, mobile
			from customer c
			join province p on (p.province_id = c.province_id)
			join municipality m on (m.municipality_id = c.municipality_id)
			join section s on (s.section_id = c.section_id)
			where customer_id = 'b57c520b-af96-4f2d-b8a1-f8ed5533f379'*/

        const [loan, meta] = await db.sequelize.query(
            `select * from loan 
            where loan_application_id in (select loan_application_id 
                                          from loan_application
                                          where customer_id = '${req.params.id}')
            and outlet_id=(select outlet_id from employee where employee_id='c2ed74d8-107c-4ef2-a5fb-6d6fadea5d1b')`
        )


        results.customerInfo = customer[0]
        results.customerLoans = [...loan]
        

        res.send(results)
    })




    router.get('/register/:userId', (req, res) =>{

        var results = {}

        Register.findOne(
            {
                where: {
                    user_id: req.params.userId,    
                    status_type: 'ENABLED'
                }
            }
        ).then(register => {
            console.log(register);
            if (register){
                results.status = true
                results.register = register
            }
            else {
                results.status = false
            }
            
            res.send(results)
        })
    })


    router.post('/register/create' , (req, res) => {

        Register.create(
            {
                amount: req.body.amount,
                description: req.body.description,
                user_id: req.body.userId,
                outlet_id: req.body.outletId,
                created_by: req.body.createdBy,
                last_modified_by: req.body.lastModifiedBy,
                status_type: 'ENABLED'
            }
        ).then( register => {
            res.send(register)
        }).catch( err  => {
            console.log(err);
        })
    })


    router.get('/payment/:id', async (req, res) => {

        const results = {}

        try {
            const [client, metaClient] = await db.sequelize.query(
                `select la.customer_id , first_name, last_name, identification
                from loan_application la
                join customer c on (c.customer_id = la.customer_id)
                where loan_application_id=(select loan_application_id
                                            from loan
                                            where loan_number_id='${req.params.id}')`
            )

            var customerId = client[0].customer_id
          
   
            const [loans, metaLoan] = await db.sequelize.query(
                `select l.loan_id, l.loan_number_id, count(quota_number) quota_amount, sum(amount_of_fee) as balance
                from amortization a
                join loan l on (l.loan_id = a.loan_id)
                where a.loan_id in (select loan_id from loan where loan_number_id in (select loan_number_id 
                                                                                from loan 
                                                                                where loan_application_id in (select loan_application_id 
                                                                                                              from loan_application
                                                                                                             where customer_id = '${customerId}')))
                and a.status_type = 'ACTIVE'
                group by l.loan_number_id, l.loan_id`
            )
            
            var currentOuotas = []
    
    
            // loans.map( item => {
            //     console.log(item);
            // })
                let loanNumbers = []
    
                loans.map( item => {
                    loanNumbers.push(item.loan_number_id)
                })
    
                const [quotas, metaQuota] = await db.sequelize.query(
                    `select amortization_id, l.loan_number_id, (amount_of_fee - total_paid) as current_fee, quota_number
                    from amortization a
                    join loan l on (a.loan_id = l.loan_id)
                    where l.loan_number_id in (${loanNumbers.join()})
                    and paid='false'
                    order by a.loan_id, quota_number`
                )

                console.log(quotas);
                results.quotas = _.groupBy(quotas, quota => quota.loan_number_id)
                results.customer = client
                results.loans = [...loans]

        } catch (error) {
            console.log(error);
        }
       
 
        

        res.send(results)
    })


    router.post('/payment/create' , async(req, res) => {

        const results = {}

        const [receiptId, metadata] = (
            `Select cast(max(html) as int) + 1 as nextHtml from receipt`
        )


        const [reference, meta] = await (
            `select cast(max(reference) as int) + 1 as reference from payment`
        )

        var receiptPaymentId = ""
        console.log(req.body);

        var counter = 1;

        console.log(req.body.amortization.length);
        
        req.body.amortization.map( quota => {

            const results = {}
            results.receipts = []

            Amortization.findOne(
                {
                    attributes:  ['total_paid'],
                    where: { amortization_id : quota.quotaId}
                }
            ).then( totalPaid => {
                console.log("log TOTAL PAID" , totalPaid);
                //Crea Amortización
                Amortization.update(
                    {
                    paid: quota.paid,
                    status_type: quota.statusType,
                    total_paid: quota.totalPaid + parseInt(totalPaid.dataValues.total_paid),
                    last_modified_by: req.body.payment.lastModifiedBy
                    },
                    {
                        where: {
                            amortization_id: quota.quotaId
                        }
                    }
                ).then( amortization => {
                    //Crea pago
                    Payment.create({
                        pay: quota.totalPaid,
                        loan_id: req.body.payment.loanId,
                        ncf: req.body.payment.ncf,
                        customer_id: req.body.payment.customerId,
                        payment_type: req.body.payment.paymentType,
                        created_by: req.body.payment.createdBy,
                        last_modified_by: req.body.payment.lastModifiedBy,
                        reference: reference[0].reference,
                        employee_id: req.body.payment.employeeId,
                        outlet_id: req.body.payment.outletId,
                        comment: req.body.payment.comment,
                        register_id: req.body.payment.registerId,
                        reference_bank: null,
                        bank: null,
                        pay_off_loan_discount: 0,
                        pay_off_loan: req.body.payment.payOffLoan,
                        capital_subscription: false,
                        status_type: 'ENABLED'
                        
                    }).then( payment =>  {
                        console.log(payment);

                        //Crea detalle del pago
                        PaymentDetail.create({
                            amortization_id: quota.quotaId,
                            payment_id: payment.dataValues.payment_id,
                            pay: payment.dataValues.total_paid
                        }).then( paymentDetail => {{

                            //Crea recibo del pago
                            Receipt.create({
                                html: receiptId[0].nextHtml,
                                receipt_number: "0000-0000",
                                comment: null,
                                payment_id: paymentDetail.dataValues.payment_id

                            }).then(receipt => {
                                results.receipts.push(receipt)
                                console.log(counter);
                                if (parseInt(req.body.amortization.length) == counter ){
                                    console.log('here');
                                    res.send(results)
                                }

                                counter++

                            }).catch( err => {
                                console.log("Error creando en receipt ", err);
                            })

                        }}).catch( err => {
                            console.log("Error creando en payment_detail " , err);
                        })

                        
                    }).catch( err => {
                        console.log("Error creando en payment ", err);
                    })

                }).catch(err => {
                    console.log("Error actualizando en Amortization ", err);
                })
            }).catch( err => {
                console.log("Error buscando en amortization ", err);
            })

         })
        
    })
    


    app.use(router)	

}
