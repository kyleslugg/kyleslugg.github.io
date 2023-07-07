import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import HeaderLinkSection from './headerLinkSection';
import Card from '@mui/material/Card';

interface HeaderProps {
  sections: ReadonlyArray<{
    title: string;
    url: string;
  }>;
  title: string;
}

export default function Header(props: HeaderProps) {
  const { sections, title } = props;

  return (
    <Card>
      <Toolbar
        className="headerSection"
        sx={{ padding: '0px', alignContent: 'center' }}
      >
        <Typography
          variant="h4"
          color="inherit"
          sx={{
            fontWeight: 600,
            margin: '0px',
            padding: '0px',
            alignContent: 'center'
          }}
        >
          {title}
        </Typography>
      </Toolbar>
      <Toolbar
        className="headerSection"
        id="headerLinks"
        sx={{ borderBottom: '.5pt solid #222222' }}
      >
        <HeaderLinkSection sections={sections} />
      </Toolbar>
    </Card>
  );
}
