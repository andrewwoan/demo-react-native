import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";
import { Pressable } from "react-native";
import HackerNewsRepository from "../../api/repository";
import HackerNewsApiClient from "../../api/api";

const apiClient = new HackerNewsApiClient();
const repository = new HackerNewsRepository(apiClient);

interface BookmarkIconProps extends SvgProps {
  itemId: number;
  type: string;
  onToggle?: (isBookmarked: boolean) => void;
}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({
  width = 24,
  height = 24,
  itemId,
  type,
  onToggle,
  ...props
}) => {
  const [isFilled, setIsFilled] = React.useState(() =>
    repository.isBookmarked(type, itemId),
  );

  const handlePress = () => {
    const newState = !isFilled;
    setIsFilled(newState);

    if (newState) {
      repository.addBookmark(type, itemId);
    } else {
      repository.removeBookmark(type, itemId);
    }

    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <Pressable onPress={handlePress}>
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
    </Pressable>
  );
};

export default BookmarkIcon;
