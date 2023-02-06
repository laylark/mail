document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  
  // Listen for form submission
  document.querySelector('#compose-form').onsubmit = () => {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients,
          subject,
          body,
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        // Add error message to view
        console.log(result.error);
      } else {
        load_mailbox('sent');
      }
    })
    .catch(error => {
      console.log({error});
    });

    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  const container = document.createElement('div');
  container.classList = 'container';
  container.id = 'email-list';
  document.querySelector('#emails-view').appendChild(container);

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const divRow = showEmail(email);

      // Load individual emails on click
      divRow.addEventListener('click', function loadEmail(event) {
        container.innerHTML = "";
        showEmail(email, true);
      });
    });
  });
}

function showEmail(email, showBody = false) {
  const sender = email.sender;
  const subject = email.subject;
  const body = email.body;
  const timestamp = email.timestamp;
  const container = document.getElementById('email-list');

  const divRow = document.createElement('div');
  divRow.classList.add('row', 'pb-2');
  divRow.style.borderBottom = '2px solid';

  const divSender = document.createElement('div');
  divSender.classList = 'col-sm';
  divSender.innerHTML = sender;

  const divSubject = document.createElement('div');
  divSubject.classList = 'col-sm';
  divSubject.innerHTML = subject;

  const divTimestamp = document.createElement('div');
  divTimestamp.classList = 'col-sm';
  divTimestamp.innerHTML = timestamp;

  document.querySelector('#emails-view').append(container);
  container.append(divRow);
  divRow.append(divSender);
  divRow.append(divSubject);
  if (showBody) {
    const divBody = document.createElement('div');
    divBody.classList = 'col-sm';
    divBody.innerHTML = body;
    divRow.append(divBody);
  }
  divRow.append(divTimestamp);

  if (!email.read) {
    divRow.style.backgroundColor = '#D3D3D3';
  }
  return divRow;
}