import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import { FormControl, FormLabel } from '@mui/material';

export default function Contact() {
  const [name, setName] = useState<string>('Name');
  const [subject, setSubject] = useState<string>('Just dropping by...');
  const [contactEmail, setContactEmail] = useState<string>(
    'its-a-me@example.com'
  );
  const [emailError, setEmailError] = useState<boolean>(false);
  const [contactNumber, setContactNumber] = useState<string>('800-888-8888');
  const [message, setMessage] = useState<string>("What's on your mind?");

  const handleSubmit = (event: unknown) => {
    //@ts-ignore
    event.preventDefault();
    if (!contactEmail) {
      setEmailError(true);
    }
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
          placeholder={name}
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
          placeholder={subject}
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
          placeholder={contactEmail}
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
          placeholder={contactNumber}
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
        placeholder={message}
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
