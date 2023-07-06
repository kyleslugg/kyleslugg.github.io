import Card from '@mui/material/Card';
import '../styles/App.scss';

function Homepage() {
  return (
    <Card
      sx={{
        boxShadow: 'none',
        //backgroundColor: '#93B2DE',
        fontSize: '0.8rem',
        fontFamily: 'Arial'
      }}
    >
      {/* import('../assets/markdown/HomepageIntro.md').then((res) => {
  fetch(res.default)
    .then((response) => response.text())
    .then((text) => console.log(text));
}); */}
      <div className="card">
        {/* <Markdown className="markdown" key={'a'}>
          {pageContent}
        </Markdown> */}
        <h1>🏗🏗🏗 UNDER ACTIVE CONSTRUCTION -- MORE COMING SOON! 🏗🏗🏗</h1>
        <p>
          Welcome! I'm Kyle Slugg-Urbino. I build apps (mostly in React.js +
          Typescript on the frontend and Node.js or Python on the back) and
          cities (mainly New York), sometimes at the same time (when I'm
          creating a routing tool or web map). In brief, I live to give people
          tools to make the abstract and complex systems they live within
          visible -- and, so, accessible to challenge.
        </p>{' '}
        [HOLD FOR IMAGE COLLAGE]{' '}
        <p>
          To learn more about me and my background, please visit my
          <a href="/about"> about </a>
          page. Recent projects and publications are located under
          <a href="/work"> work </a>.
        </p>{' '}
        <p>
          If you've read this far, we should get in touch. Send me a note via
          the <a href="/contact"> contact </a> page, or drop by
          <a href="https://www.linkedin.com/in/kyle-slugg/">
            {' '}
            LinkedIn{' '}
          </a> or <a href="https://github.com/kyleslugg">GitHub</a>. Talk soon!
        </p>
      </div>
    </Card>
  );
}

export default Homepage;
