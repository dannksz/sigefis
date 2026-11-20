interface FormBoxProps {
  children: React.ReactNode;
}

export default function FormBox({ children }: FormBoxProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl">
      {children}
    </div>
  );
}
