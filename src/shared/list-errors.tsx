import type { ApiError } from '../core/api/errors';

type ListErrorsProps = {
  errors: Pick<ApiError, 'errors'> | null;
};

export function ListErrors({ errors }: ListErrorsProps) {
  const errorList = errors ? Object.keys(errors.errors || {}).map(key => `${key} ${errors.errors[key]}`) : [];

  return (
    <ul className="error-messages">
      {errorList.map(error => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
