const express = require("express")
const getBalance = require("../utils/getBalance")
const router = express.Router()
const {v4} = require("uuid")

const customers = [];

function verifyIfExistsCpfAccount(request,response,next){
    const {cpf} = request.params

    const customer = customers.find(customer => customer.cpf === cpf)

    if(!customer){
        return response.status(400).json({
            error: "Customer not found"
        })
    }

    request.customer = customer;

    return next()
}

router.post("/account", (request,response)=>{
    const {cpf,name} = request.body;
    const customerAlreadyExists = customers.some((customer)=>customer.cpf === cpf);

    if(customerAlreadyExists){
        return response.status(400).send({
            error: "Costumer already exists!"
        })
    }

    customers.push({
        cpf,
        name,
        id: v4(),
        statement: []
    })

    return response.status(201).send()
})

router.get("/account/all", (_request,response)=>{
    return response.json(customers)
})

router.get("/statement/:cpf",verifyIfExistsCpfAccount,(request,response)=>{
    const {customer} = request
    return response.json(customer.statement)
})

router.post("/deposit/:cpf",verifyIfExistsCpfAccount,(request,response)=>{
    const {amount,description} = request.body
    const {customer} = request

    const statementOperation = {
        amount,
        description,
        type: "credit",
        created_at: new Date()
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()
})

router.post("/withdraw/:cpf",verifyIfExistsCpfAccount, (request,response)=>{
    const {amount} = request.body
    const {customer} = request
    const balance = getBalance(customer.statement)

    if(balance < amount){
        return response.status(400).json({
            error: "Insufficient funds!"
        })
    }

    const statementOperation = {
        amount,
        type: "debit",
        created_at: new Date()
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()
})

router.get("/statement/date/:cpf",verifyIfExistsCpfAccount,(request,response)=>{
    const {customer} = request
    const {date} = request.query

    const dateFormat = new Date(date + " 00:00")

    const statement = customer.statement.filter((statement)=> statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    return response.json(statement)
})

router.put("/account/:cpf",verifyIfExistsCpfAccount,(request,response)=>{
    const {name} = request.body
    const {customer} = request
    customer.name = name

    return response.status(201).send()
})

router.get("/account/:cpf", verifyIfExistsCpfAccount, (request,response)=>{
    const {customer} = request
    return response.json(customer)
})

router.delete("/account/:cpf",verifyIfExistsCpfAccount, (request,response)=>{
    const {customer} = request
    customers.splice(customer,1)

    return response.status(200).json(customers)
})

router.get("/balance/:cpf",verifyIfExistsCpfAccount, (request,response)=>{
    const {customer} = request
    
    const balance = getBalance(customer.statement)

    return response.json(balance)
})

module.exports = router;