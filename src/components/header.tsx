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
      <Toolbar>
        <Typography
          component="h2"
          variant="h5"
          color="inherit"
          align="left"
          sx={{ fontWeight: 600, flex: 1, margin: '0px', padding: '0px' }}
        >
          {title}
        </Typography>
      </Toolbar>
      <Toolbar>
        <HeaderLinkSection sections={sections} />
      </Toolbar>
    </Card>
  );
}
