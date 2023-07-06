import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import { FormControl, FormLabel } from '@mui/material';
import emailjs from '@emailjs/browser';

export default function Contact() {
  const defaults = {
    name: 'Name',
    subject: 'Just dropping by...',
    contactEmail: 'its-a-me@example.com',
    emailError: false,
    contactNumber: '(800) 888-8888',
    message: "What's on your mind?"
  };
  const [name, setName] = useState<string>();
  const [subject, setSubject] = useState<string>();
  const [contactEmail, setContactEmail] = useState<string>();
  const [emailError, setEmailError] = useState<boolean>(false);
  const [contactNumber, setContactNumber] = useState<string>();
  const [message, setMessage] = useState<string>();

  emailjs.init('41dpsM5eCTMqhsLFZ');

  const resetFields = () => {
    setName('');
    setSubject('');
    setContactEmail('');
    setContactNumber('');
    setMessage('');
  };

  const handleSubmit = (event: unknown) => {
    //@ts-ignore
    event.preventDefault();
    if (!contactEmail) {
      setEmailError(true);
    }
    const serviceId = 'ks_gmail';
    const templateId = 'portfolio_contact';
    const vars = {
      from_name: name,
      subject: subject,
      contact_email: contactEmail,
      contact_number: contactNumber,
      message: message
    };
    emailjs.send(serviceId, templateId, vars);
    resetFields();
  };

  return (
    <FormControl sx={{ display: 'flex', padding: '20px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(100px, 10%) minmax(240px, 80%)'
        }}
      >
        <FormLabel
          sx={{ display: 'flex', alignItems: 'end', justifyContent: 'left' }}
        >
          Name:
        </FormLabel>
        <Input
          size="small"
          margin="dense"
          fullWidth
          placeholder={defaults.name}
          value={name}
          className="formEl"
          onChange={(e) => setName(e.target.value)}
        ></Input>
        <FormLabel
          sx={{ display: 'flex', alignItems: 'end', justifyContent: 'left' }}
        >
          Subject:
        </FormLabel>
        <Input
          size="small"
          margin="dense"
          fullWidth
          className="formEl"
          placeholder={defaults.subject}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        ></Input>
        <FormLabel
          sx={{ display: 'flex', alignItems: 'end', justifyContent: 'left' }}
        >
          Email:
        </FormLabel>
        <Input
          size="small"
          margin="dense"
          fullWidth
          type="email"
          className="formEl"
          placeholder={defaults.contactEmail}
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          error={emailError}
        ></Input>
        <FormLabel
          sx={{ display: 'flex', alignItems: 'end', justifyContent: 'left' }}
        >
          Phone:
        </FormLabel>
        <Input
          size="small"
          margin="dense"
          fullWidth
          type="phone"
          className="formEl"
          placeholder={defaults.contactNumber}
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
        ></Input>
      </div>
      <FormLabel
        sx={{
          display: 'flex',
          alignItems: 'end',
          justifyContent: 'left',
          marginTop: '20px'
        }}
      >
        Message:
      </FormLabel>

      <TextField
        size="small"
        margin="dense"
        fullWidth
        multiline
        minRows={3}
        className="formEl"
        placeholder={defaults.message}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      ></TextField>

      <Button
        onClick={(e) => {
          handleSubmit(e);
        }}
      >
        Submit
      </Button>
    </FormControl>
  );
}
