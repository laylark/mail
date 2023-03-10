document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => loadMailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => loadMailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => loadMailbox('archive'));
  document.querySelector('#compose').addEventListener('click', composeEmail);

  // By default, load the inbox
  loadMailbox('inbox');
});

function composeEmail() {

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
        // Add error message with dismissal to view
        showError(result.error);
      } else {
        loadMailbox('sent');
      }
    })
    .catch(error => {
      console.log({error});
    });

    return false;
  }
}

function loadMailbox(mailbox) {
  
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
      const divRow = showEmail(email, mailbox);

      // Load individual emails on click
      divRow.addEventListener('click', function loadEmail() {
        container.innerHTML = "";
        showEmail(email, mailbox, true);
      });
    });
  });
}

function showEmail(email, mailbox, showBody = false) {
  const {
    sender,
    subject,
    body,
    timestamp,
    recipients,
  } = email;

  const container = document.getElementById('email-list');

  // Create email element
  const divRow = document.createElement('div');
  divRow.classList.add('row', 'pb-2');
  divRow.style.borderBottom = '2px solid';

  const divSender = document.createElement('div');
  divSender.classList = 'col-sm';
  divSender.innerHTML = `<strong>${sender}</strong>`;
  divRow.append(divSender);

  const divRecipients = document.createElement('div');
  divRecipients.classList = 'col-sm';
  divRecipients.innerHTML = recipients;

  if (showBody) {
    divRow.append(divRecipients);
  }

  const divSubject = document.createElement('div');
  divSubject.classList = 'col-sm';
  divSubject.innerHTML = subject;
  divRow.append(divSubject);

  const divTimestamp = document.createElement('div');
  divTimestamp.classList = 'col-sm';
  divTimestamp.innerHTML = timestamp;

  document.querySelector('#emails-view').append(container);

  container.append(divRow);

  // Show full email if clicked
  if (showBody) {
    const divBody = document.createElement('div');
    divBody.innerHTML = body;
    container.append(divBody);

    divSender.innerHTML = `<strong>From: ${sender}</strong>`;
    divRecipients.innerHTML = `To: ${recipients}`;
    divSubject.innerHTML = `<h4>${subject}</h4>`;

    // Mark email as read
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    });
  }
  
  divRow.append(divTimestamp);

  if (email.read) {
    divRow.style.backgroundColor = '#D3D3D3';
  }

  // Create reply button
  let replyButton = document.createElement('button');
  replyButton.classList = 'btn btn-sm btn-outline-success flex m-1';
  replyButton.innerHTML = 'Reply';
  divRow.append(replyButton);

  // Compose new email if reply clicked
  replyButton.addEventListener('click', () => {
    composeEmail();
    const replySubject = document.querySelector('#compose-subject');
    const replyBody = document.querySelector('#compose-body');
    const replyRecipients = document.querySelector('#compose-recipients');
    replyRecipients.value = sender;
    replyBody.value = `On ${timestamp} ${sender} wrote: ${body}`;

    if (subject.slice(0, 4) != 'RE: ' ) {
      replySubject.value = `RE: ${subject}`;
    } else {
      replySubject.value = subject;
    }
  });

  if (mailbox != 'sent') {

    // Create archive button
    let archiveButton = document.createElement('button');
    archiveButton.classList = 'btn btn-sm btn-outline-danger flex m-1';
    archiveButton.innerHTML = 'Archive';

    // Determine the archive button text
    let archiveStatus = email.archived;

    archiveButton.innerHTML = archiveStatus ? 'Unarchive' : 'Archive';

    archiveButton.addEventListener('click', async (event) => {
      event.stopPropagation();

      await fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !archiveStatus,
        })
      });

      loadMailbox('inbox');
    });
    
    divRow.append(archiveButton);
  }

  return divRow;
}

function showError(error) {
  const divError = document.createElement('div');
  divError.classList.add('error-btn', 'alert', 'alert-warning', 'alert-dismissible', 'fade', 'show');
  divError.innerHTML = error;
  document.querySelector('#compose-view').prepend(divError);

  const errorButton = document.createElement('button');
  errorButton.classList.add('close');
  errorButton.setAttribute('data-bs-dismiss', 'alert');
  errorButton.setAttribute('aria-label', 'Close');

  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = '&times;';
  
  document.querySelector('.error-btn').append(errorButton);
  document.querySelector('.close').append(span);

  return divError;
}