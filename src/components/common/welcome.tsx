interface WelcomeProps {
  name: string;
}

const Welcome = ({ name }: WelcomeProps) => {
  return <div>Hello, {name}</div>;
};

export default Welcome;
