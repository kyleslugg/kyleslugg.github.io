import { Card } from '@mui/material';
export interface BlurbInfo {
  date: string;
  title: string;
  imgSrc: string;
  blurbText: string;
  fulltextUri: string;
}
export default function PostLede(props: {
  data: BlurbInfo;
  photoDirectory: string;
}) {
  const { title, imgSrc, blurbText, fulltextUri } = props.data;
  const { photoDirectory } = props;

  return (
    <Card
      className="postBlurbHolder"
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gridColumnGap: '10px',
        padding: '5px',
        width: '100%',
        height: '175px',
        boxShadow: '0pt 0pt 2pt 2pt #00000022'
      }}
    >
      <div
        className="workImgHolder"
        style={{
          backgroundImage: `Url(${photoDirectory.concat(imgSrc)})`
        }}
      ></div>
      <div className="postBlurbText">
        <h4>{title}</h4>
        <p>
          {blurbText}{' '}
          <a href={fulltextUri} target="_blank" style={{ marginRight: '10px' }}>
            Read More &#10142;{' '}
          </a>
        </p>
      </div>
    </Card>
  );
}
