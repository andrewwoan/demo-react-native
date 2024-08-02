import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";
import { TouchableOpacity } from "react-native";

interface BookmarkIconProps extends SvgProps {
  onToggle?: () => void;
}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({
  width = 24,
  height = 24,
  onToggle,
  ...props
}) => {
  const [isFilled, setIsFilled] = React.useState(false);

  const handlePress = () => {
    setIsFilled(!isFilled);
    if (onToggle) {
      onToggle();
    }
    console.log("Hello World");
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Svg width={width} height={height} viewBox="0 0 24 24" {...props}>
        <Path
          fill={isFilled ? "#000" : "none"}
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"
        />
      </Svg>
    </TouchableOpacity>
  );
};

export default BookmarkIcon;
