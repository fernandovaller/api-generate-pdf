const express = require('express');
const bodyParser = require('body-parser');
const config = require('config');
const puppeteer = require('puppeteer');
const uuidv4 = require('uuid/v4');
const fs = require('fs');

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
  let url = req.params;
  res.send('API para gerar PDF');
});

// Faz o download do arquivo
app.get('/download/:id', function (req, res) {

  let arquivo = req.params.id;

  if(!arquivo){
    res.send(`${arquivo} nao localizado!`);
  }

  fs.access(`./uploads/${arquivo}`, fs.F_OK, (err) => {
    if (err) {
      res.send(`${arquivo} nao localizado!`);
    }
    // Envia o arquivo para download
    res.download(`./uploads/${arquivo}`);
  });

});

// Receber a url da pagina a ser convertida para PDF
app.post('/pdf', async function (req, res) {

  let url = req.body.url;

  let pdf = await getPDF(url);

  let pdf_link = `${process.env.APP_URL}/download/${pdf}`;

  let dados = {
    url: url,
    pdf: pdf_link
  }

  res.send(dados).json();

});

app.listen(process.env.PORT || config.get('server.port'), function(){
  console.log(`Servidor rodando em ${process.env.PORT}`);
});

const getPDF = async (url) => {
  let name_rand = uuidv4();
  let file_name = `pdf-${name_rand}.pdf`;
  let file_path = process.env.APP_URL_UPLOADS || config.get('server.path');

  const browser = await puppeteer.launch({
    //headless: false
    'args' : [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  const page = await browser.newPage();

  await page.goto(url, {waitUntil: 'networkidle2'});
  await page.pdf({
    path: `${file_path}/${file_name}`,
    scale: 1,
    format: 'A4',
    printBackground: true,
    margin: {top:'1cm', right:'1cm', bottom:'1cm', left:'1cm'}
  });

  await browser.close();

  return file_name;
}