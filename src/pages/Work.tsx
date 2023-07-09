import { Card, Container, Grid } from '@mui/material';
import PostLede, { BlurbInfo } from '../components/postLede';
import blurbs from '../assets/markdown/posts/blurbs.json';
import '../styles/Posts.scss';

export default function Work() {
  const blurbData: BlurbInfo[] = JSON.parse(JSON.stringify(blurbs));
  const photoDirectory = '/post_images/';
  const blurbElements = blurbData.map((el) => (
    <PostLede data={el} photoDirectory={photoDirectory} />
  ));

  return (
    <Card sx={{ fontFamily: 'Arial' }}>
      <div className="card">
        <h3>The Latest</h3>
        <h4>🏗 Hard Hats Advised: Some portions under construction 🏗</h4>
        <Grid>{blurbElements}</Grid>
      </div>
    </Card>
  );
}
