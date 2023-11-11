export const openPopupWindow = ({
  url,
  width = 600,
  height = 720,
}: {
  url: string;
  width?: number;
  height?: number;
}) => {
  const leftPosition = window.screen.width / 2 - (width / 2 + 10);
  const topPosition = window.screen.height / 2 - (height / 2 + 50);
  window.open(
    url,
    "_blank",
    "status=no,height=" +
      height +
      ",width=" +
      width +
      ",resizable=yes,left=" +
      leftPosition +
      ",top=" +
      topPosition +
      ",screenX=" +
      leftPosition +
      ",screenY=" +
      topPosition +
      ",toolbar=no,menubar=no,scrollbars=no,location=no,directories=no",
  );
};
