import Card from '@mui/material/Card';

export default function About() {
  return (
    <Card sx={{ fontFamily: 'Arial' }}>
      <div className="card">
        <h3>Welcome! I'm Kyle Slugg-Urbino.</h3>
        <p>
          I'm a software engineer working (mostly) in JavaScript/TypeScript and
          Python to develop and improve open-source tools that render real-time
          operational information about complex systems accessible to senior
          decisionmakers, esp. those in city and metropolitan governments. I'm
          currently working on walk routing tools to facilitate deeper
          engagement between citizens and their environments. Reach out to talk
          urban informatics, data-driven governance, and/or the beautiful and
          complex interdependencies of urban life.
        </p>
        <p>
          As a former translator and public servant, I am keenly aware of how
          making change depends on turning messy facts and data into a strong,
          compelling narrative that will drive policymakers to action. I take
          pride in my ability to make complex topics understandable to
          non-technical decisionmakers as well as the public. Let's figure out
          how we can work together to make urban space function better for all
          of us.
        </p>
      </div>
    </Card>
  );
}
