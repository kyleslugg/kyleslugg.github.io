import Card from '@mui/material/Card';

export default function About() {
  return (
    <Card sx={{ fontFamily: 'Arial' }}>
      <div className="card">
        <h2>🏗 CAUTION: Under Construction 🏗</h2>
        <h3>Welcome! I'm Kyle Slugg-Urbino.</h3>
        <p>
          I blend policy analysis and data science to figure out how urban
          governance can promote racial and economic justice, so that all New
          Yorkers share in our city's prosperity.
        </p>
        <p>
          As a former translator, I am keenly aware of how making change depends
          on turning messy facts and data into a strong, compelling narrative
          that will drive policymakers to action. I take pride in my ability to
          make complex topics understandable to non-technical decisionmakers as
          well as the public, using both clear writing and compelling visuals.
          Let's figure out how we can work together to make urban space function
          better for all of us.
        </p>
        <p>My areas of expertise include:</p>
        <ul>
          <li>Statistical modeling using Stata and Python</li>
          <li>Geospatial Analysis and Analytic Mapping</li>
          <li>Real Estate Market Analysis</li>
          <li>Data Visualization</li>
          <li>Policy Writing</li>
        </ul>
      </div>
    </Card>
  );
}
