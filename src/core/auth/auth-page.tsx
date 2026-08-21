import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import type { ApiError } from '../api/errors';
import { ListErrors } from '../../shared/list-errors';
import { useAuth } from './auth-context';

const emptyErrors: ApiError = { errors: {}, status: 0 };

export function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const authType = location.pathname.endsWith('/register') ? 'register' : 'login';
  const title = authType === 'login' ? 'Sign in' : 'Sign up';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<ApiError>(emptyErrors);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(() => {
    if (!email || !password) {
      return false;
    }
    if (authType === 'register' && !username) {
      return false;
    }
    return true;
  }, [authType, email, password, username]);

  async function submitForm(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors(emptyErrors);

    try {
      if (authType === 'login') {
        await login({ email, password });
      } else {
        await register({ username, email, password });
      }
      void navigate('/');
    } catch (error) {
      setErrors(error as ApiError);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">{title}</h1>
            <p className="text-xs-center">
              {authType === 'register' && <Link to="/login">Have an account?</Link>}
              {authType === 'login' && <Link to="/register">Need an account?</Link>}
            </p>
            <ListErrors errors={errors} />
            <form onSubmit={event => void submitForm(event)}>
              <fieldset disabled={isSubmitting}>
                <fieldset className="form-group">
                  {authType === 'register' && (
                    <input
                      name="username"
                      placeholder="Username"
                      className="form-control form-control-lg"
                      type="text"
                      value={username}
                      onChange={event => setUsername(event.target.value)}
                    />
                  )}
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="email"
                    placeholder="Email"
                    className="form-control form-control-lg"
                    type="text"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="password"
                    placeholder="Password"
                    className="form-control form-control-lg"
                    type="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                  />
                </fieldset>
                <button className="btn btn-lg btn-primary pull-xs-right" disabled={!isValid} type="submit">
                  {title}
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
