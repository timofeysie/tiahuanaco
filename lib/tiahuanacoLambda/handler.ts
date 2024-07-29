export const handler = async (): Promise<string> => {
    const version = process.env.VERSION;
    return `TiahuanacoStack v${version}`;
  };
  