import { DialButton, DialButtonData } from "./DialButton";

type Props = {
  onDialButtonClick: (data: DialButtonData) => void;
};
const Keyboard = ({onDialButtonClick}: Props) => {
  return (
    <div
      data-testid="dialpad"
      className="grid grid-cols-3 gap-4 mt-4 place-items-center"
    >
      <DialButton onClick={onDialButtonClick} digit="1" />
      <DialButton onClick={onDialButtonClick} digit="2" characters="ABC" />
      <DialButton onClick={onDialButtonClick} digit="3" characters="DEF" />
      <DialButton onClick={onDialButtonClick} digit="4" characters="GHI" />
      <DialButton onClick={onDialButtonClick} digit="5" characters="JKL" />
      <DialButton onClick={onDialButtonClick} digit="6" characters="MNO" />
      <DialButton onClick={onDialButtonClick} digit="7" characters="PQRS" />
      <DialButton onClick={onDialButtonClick} digit="8" characters="TUV" />
      <DialButton onClick={onDialButtonClick} digit="9" characters="WXYZ" />
      <DialButton onClick={onDialButtonClick} digit="*" />
      <DialButton onClick={onDialButtonClick} digit="0" />
      <DialButton onClick={onDialButtonClick} digit="#" />
      <DialButton className="hidden" digit="Backspace" />
      <DialButton className="hidden" digit="Call" />
    </div>
  );
};

export default Keyboard;
