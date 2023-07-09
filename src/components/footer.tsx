import gitHubLogo from '@mui/icons-material/GitHub';
import linkedInLogo from '@mui/icons-material/LinkedIn';
import spotifyIcon from '@mui/icons-material/MusicNoteRounded';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';

export default function Footer() {
  const socials: { icon: React.ElementType; name: string; url: string }[] = [
    {
      icon: gitHubLogo,
      name: 'kyleslugg',
      url: 'https://github.com/kyleslugg'
    },
    {
      icon: linkedInLogo,
      name: 'kyle-slugg',
      url: 'https://www.linkedin.com/in/kyle-slugg/'
    },
    {
      icon: spotifyIcon,
      name: 'me-coded',
      url: 'https://open.spotify.com/playlist/3XE1EI1TpQNTJjzD3iD4Fe?si=9840cb47847e4efd'
    }
  ];
  return (
    <Card>
      <div
        className="socialLinkHolder"
        style={{ borderTop: '.5pt solid #222222' }}
      >
        {socials.map((network) => (
          <Link
            display="block"
            variant="body1"
            href={network.url}
            key={network.name}
            sx={{
              mb: 0.5,
              color: 'black',
              display: 'flex',
              gap: '4px',
              marginInlineEnd: '15px'
            }}
          >
            <network.icon />
            <span>{network.name}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
