import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';

type HMProps = {
  sections: readonly { title: string; url: string }[];
  handleMenu: (event: React.MouseEvent<HTMLElement>) => void;
  handleClose: () => void;
  handleSectionClick: () => void;
  anchorEl: HTMLAnchorElement | null;
};

const HeaderMenu = (props: HMProps) => {
  const { sections, handleMenu, handleClose, handleSectionClick, anchorEl } =
    props;

  return (
    <div>
      <IconButton
        size="large"
        edge="start"
        color="inherit"
        aria-label="menu"
        sx={{ mr: 2 }}
        onClick={handleMenu}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {sections.map((section) => (
          <MenuItem onClick={handleSectionClick}>{section.title}</MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default HeaderMenu;
