/**
 * SpotlessPro Contentdienst — run setupForms() from the intended Google account.
 * No external services. Does not publish forms automatically.
 * Check access controls, email deliverability and test runs before going live.
 */
const ADMIN = 'habbekratsalgorythms@gmail.com';
const TERMS = 'https://habbekratsalgorythms.github.io/contentdienst/voorwaarden.html';
const PRIVACY = 'https://habbekratsalgorythms.github.io/contentdienst/privacy.html';
const PRODUCTS = [
  {name:'Contentpakket', price:'€79 inclusief 21% btw', cost:'79', link:'https://payment-links.mollie.com/payment/tSyVpTpDtBwsyTrXQ4zYT'},
  {name:'Website', price:'€195 inclusief 21% btw', cost:'195', link:'https://payment-links.mollie.com/payment/q7rpyHGYd2QXqZohXKobH'}
];
function requiredText(form, title, required=true) {
  return form.addTextItem().setTitle(title).setRequired(required);
}
function choice(form, title, choices, required=true) {
  return form.addMultipleChoiceItem().setTitle(title).setChoiceValues(choices).setRequired(required);
}
function makeForm(p) {
  const form=FormApp.create('SpotlessPro Contentdienst — '+p.name);
  form.setDescription('Zakelijk bestelproces. Geen persoonsgegevens van klanten of personeel invullen. Logo’s en foto’s kunnen na de bestelling per e-mail worden toegestuurd.');
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  // Forms initially remain closed until tested. Testing may be performed using the owner preview.
  form.setAcceptingResponses(false);
  form.addSectionHeaderItem().setTitle('Uw bedrijf');
  requiredText(form,'Bedrijfsnaam');
  requiredText(form,'KvK-nummer');
  requiredText(form,'Factuuradres — straat en huisnummer');
  requiredText(form,'Factuuradres — postcode');
  requiredText(form,'Factuuradres — plaats');
  requiredText(form,'Contactpersoon');
  requiredText(form,'E-mailadres (ook voor factuur)').setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
  requiredText(form,'Btw-nummer (optioneel)',false);
  form.addPageBreakItem().setTitle('Over uw bedrijf');
  form.addSectionHeaderItem().setTitle('Geen persoonsgegevens van klanten of personeel. Logo’s en foto’s mogen later per e-mail.');
  requiredText(form,'Wat doet uw bedrijf? (1–2 zinnen)');
  requiredText(form,'Plaats / werkgebied');
  requiredText(form,'Top 3 diensten of producten');
  choice(form,'Toon',['Informeel','Zakelijk']);
  choice(form,'Aanspreekvorm',['je/jij','u/uw']);
  if(p.name==='Contentpakket') choice(form,'Welke platforms?',['Instagram','TikTok','LinkedIn','Meerdere (toelichten in antwoord op bevestigingsmail)']);
  else requiredText(form,'Welke openbare contactgegevens mogen op de site? (telefoon/e-mail/adres/openingstijden; geef per gegeven expliciet ja/nee)');
  form.addPageBreakItem().setTitle('Akkoord');
  form.addSectionHeaderItem().setTitle(p.name+' — '+p.price+' — levering binnen vijf werkdagen na betaling en complete intake. Algemene voorwaarden: '+TERMS+' | Privacy: '+PRIVACY);
  form.addCheckboxItem().setTitle('Ik bestel namens een onderneming en ga akkoord met de algemene voorwaarden').setChoiceValues(['Akkoord']).setRequired(true);
  form.setConfirmationMessage('Bedankt! Betaal nu veilig met iDEAL: '+p.link+'. Na ontvangst van de betaling leveren wij binnen vijf werkdagen. U krijgt dezelfde link per e-mail.');
  return form;
}
function setupForms() {
  const props=PropertiesService.getScriptProperties();
  PRODUCTS.forEach(p => {
    const key='form_'+p.name;
    if(props.getProperty(key)) throw new Error('Form already configured: '+p.name);
    const form=makeForm(p);
    props.setProperty(key,form.getId());
    const fn=p.name==='Contentpakket' ? 'onContentSubmit':'onWebsiteSubmit';
    ScriptApp.newTrigger(fn).forForm(form).onFormSubmit().create();
    console.log(p.name+' edit URL: '+form.getEditUrl()+' | response URL: '+form.getPublishedUrl());
  });
}
function onContentSubmit(e){handleSubmit(e,PRODUCTS[0]);}
function onWebsiteSubmit(e){handleSubmit(e,PRODUCTS[1]);}
function handleSubmit(e,p){
  if(!e || !e.response || !e.source) throw new Error('Form submit event required');
  const id=PropertiesService.getScriptProperties().getProperty('form_'+p.name);
  if(e.source.getId()!==id) throw new Error('Unexpected form source');
  const answers=e.response.getItemResponses().map(ir=>[ir.getItem().getTitle(),String(ir.getResponse() ?? '')]);
  const get=key=>(answers.find(a=>a[0]===key)||[])[1]||'';
  const company=get('Bedrijfsnaam').replace(/[\r\n]/g,' ').slice(0,100);
  const email=get('E-mailadres (ook voor factuur)').trim();
  if(!company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Missing or invalid company/email');
  const body='Nieuwe bestelling: '+p.name+'\nPrijs: '+p.price+'\n\n'+answers.map(a=>a[0]+': '+a[1]).join('\n');
  MailApp.sendEmail({to:ADMIN,subject:'NIEUWE BESTELLING '+p.name+' - '+company,body,name:'SpotlessPro Contentdienst'});
  MailApp.sendEmail({
    to:email,
    subject:'Uw bestelling bij SpotlessPro Contentdienst',
    body:'Bedankt voor uw bestelling bij SpotlessPro Contentdienst.\n\nPakket: '+p.name+'\nPrijs: '+p.price+'\nBetaal veilig met iDEAL: '+p.link+'\nAlgemene voorwaarden: '+TERMS+'\nPrivacyverklaring: '+PRIVACY+'\n\nLevering binnen vijf werkdagen na betaling en complete intake.\n\nContact: '+ADMIN,
    name:'SpotlessPro Contentdienst'
  });
}
