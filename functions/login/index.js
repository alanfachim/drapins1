//@ts-check 
const db = require('../share/app')
function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
module.exports = async function (context, req) {

  if (req.query.user !== undefined && req.query.password !== undefined) {
    await db.queryContainer('CLIENTE', req.query.user)
      .then((data) => {
        if (data.resources.length == 0) {
          throw 'usuario não encontrado'
        }
        var cliente = data.resources[0];
        if (cliente.password == req.query.password) {
          context.res = {
            body: {
              token: db.geratoken(req.query.user, req.headers['x-forwarded-for'] || '').split(',').pop().trim(),
              cliente: {
                email: (cliente.id || '').trim(),
                telefone: (cliente.telefone || '').trim(),
                endereco: (cliente.endereco || '').trim(),
                cidade: (cliente.cidade || '').trim(),
                estado: (cliente.estado || '').trim(),
                cep: (cliente.cep || '').trim(),
                numero: (cliente.numero || '').trim(),
                nome: (cliente.nome || '').trim()
              }
            }
          };
          if(cliente.type=='admin')
          context.res.body.extra=[{name:'admin',url:`/admin?token=${context.res.body.token}&user=${cliente.id}`}]; 


        } else {
          context.res = {
            body: { erro: 'Usuário ou senha inválida!' }
          };
        }
      })
      .catch(error => {
        context.res = {
          body: { erro: error }
        };
      })
  } else {
    if (req.query.cadastro !== undefined) {
      var pass = randomString(4, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
      var cliente = {
        id: req.query.email.trim(),
        telefone: req.query.telefone.trim(),
        nome: req.query.nome.trim(),
        endereco: req.query.endereco.trim(),
        numero: req.query.numero.trim(),
        cidade: req.query.cidade.trim(),
        complemento: req.query.complemento.trim(),
        estado: req.query.estado.trim(),
        cep: req.query.cep.trim(),
        type: 'client',
        password: req.query.secret.trim(),
        pedidos: [],
        message: [],
        notificar: []
      }
      await db.createDatabase()
        .then(() => db.createContainer('CLIENTE'))
        .then(() => db.queryContainer('CLIENTE', req.query.email.trim()))
        .then((data) => {
          if (data.resources.length == 0) {
            return db.createFamilyItem(cliente, 'CLIENTE')
          } else {
            throw 'Usuário já existe, faça o login.';
          }
        }).then(() => {
          console.log('usuário cad')
        }).then(() => {
          cliente.email = req.query.email.trim();
          var subj = [`DRA Pins - Usuário Cadastrado`];
          var body = [`<h4>Olá ${req.query.nome}</h4><p>Informações para acessar sua conta</p><p>Usuário: ${req.query.email}</p><p>Senha: ${req.query.secret.trim()}</p> `];
          const sgMail = require('@sendgrid/mail');
          sgMail.setApiKey('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');
          const msg = {
            to: req.query.email.trim(),//req.query.email,
            from: 'vendas@drapins.com',//config.to,
            subject: subj[0],
            html: body[0],
          };
          sgMail.send(msg);
        }).then(() => {
          context.res = {
            body: {
              token: db.geratoken(req.query.email.trim(), req.headers['x-forwarded-for'] || '').split(',').pop().trim(),
              cliente: cliente
            }
          };
          return;
        })
        .catch(error => {
          context.res = {
            body: { erro: error }
          };
          return;
        });

    } else {
      context.res = {
        body: { erro: 'Usuário ou senha inválida!' }
      };
    }
  }

} 
