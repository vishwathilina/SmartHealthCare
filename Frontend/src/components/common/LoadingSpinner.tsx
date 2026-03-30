const LoadingSpinner = ({ small = false }: { small?: boolean }) => {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary ${small ? "h-4 w-4" : "h-6 w-6"}`}
    />
  );
};

export default LoadingSpinner;
