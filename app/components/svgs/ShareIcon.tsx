import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

interface ShareIconProps extends SvgProps {
  // You can add any additional props here if needed
}

const ShareIcon: React.FC<ShareIconProps> = ({
  width = 26,
  height = 26,
  ...props
}) => (
  <Svg width={width} height={height} fill="none" viewBox="0 0 26 26" {...props}>
    <Path
      fill="#000"
      d="M18.958 15.437A3.508 3.508 0 0 0 16.12 16.9l-5.73-2.817c.11-.35.17-.715.172-1.083a3.672 3.672 0 0 0-.173-1.084L16.12 9.1a3.5 3.5 0 1 0-.682-2.058c.003.181.021.362.055.541l-5.926 2.98a3.456 3.456 0 0 0-2.524-1.084 3.521 3.521 0 1 0 1.374 6.762c.434-.187.825-.46 1.15-.804l5.926 2.98a3.192 3.192 0 0 0-.055.552 3.52 3.52 0 1 0 3.521-3.52v-.012Zm0-10.291a1.896 1.896 0 1 1-1.896 1.896 1.906 1.906 0 0 1 1.896-1.896Zm-11.916 9.75A1.895 1.895 0 1 1 8.937 13a1.907 1.907 0 0 1-1.895 1.896Zm11.916 5.958a1.896 1.896 0 1 1 1.896-1.896 1.906 1.906 0 0 1-1.896 1.896Z"
    />
  </Svg>
);

export default ShareIcon;
