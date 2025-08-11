import * as Icons from '@mui/icons-material';
import type { SvgIconProps } from '@mui/material';

interface MaterialIconProps extends SvgIconProps {
  iconName: string;
}

export default function MaterialIcon({ iconName, ...props }: MaterialIconProps) {
  const IconComponent = (Icons as any)[iconName] || Icons['HelpOutline'];
  return <IconComponent {...props} />;
}