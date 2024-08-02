import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

interface BookmarkIconProps extends SvgProps {}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({
  width = 24,
  height = 24,
  ...props
}) => (
  <Svg width={width} height={height} fill="none" viewBox="0 0 24 24" {...props}>
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"
    />
  </Svg>
);

export default BookmarkIcon;
