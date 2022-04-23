const { response } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid')

const app = express();

app.use(express.json());

const customers = [];

// Middlewere
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if(!customer) {
    return response.status(400).json({error: "Customer not found"});
  }

  request.customer = customer; 

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type == 'credit') {
      return acc + operation.amount;
    }
    else {
      return acc - operation.amount;
    }
  }, 0)

  return balance
}

app.post('/account', (request, response) => {
  const {cpf, name } = request.body;

  const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);

  if(customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists!"});
  }


  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  })

  return response.status(201).json({ sucess: "Customer created!"});

})

// app.use(verifyIfExistsAccountCPF)

app.get('/statement', verifyIfExistsAccountCPF,(request, response) => {
  const { customer } = request;
  return response.json(customer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount} = request.body;

  const { customer } = request

  const statementOpertaion = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOpertaion);

  return response.status(201).json({ sucess: "Sucess in deposit"});
})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if(balance < amount) {
    return response.status(400).json({error: "Insufficient fund!"})
  }

  const statementOpertaion = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(statementOpertaion);

  return response.status(201).json({ sucess: "Sucess"});
});

app.listen(3333);