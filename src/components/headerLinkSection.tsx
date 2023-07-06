import MuiLink from '@mui/material/Link';
import { Link } from 'react-router-dom';

type HLProps = {
  sections: readonly { title: string; url: string }[];
};

const HeaderLinkSection = (props: HLProps) => {
  const { sections } = props;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {sections.map((section) => (
        <MuiLink
          color="inherit"
          key={section.title}
          variant="body2"
          href={section.url}
          sx={{ p: 1, flexShrink: 0 }}
        >
          <Link to={section.url}>{section.title}</Link>
        </MuiLink>
      ))}
    </div>
  );
};

export default HeaderLinkSection;
