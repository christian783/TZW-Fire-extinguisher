import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/register", form);
      login(response.data.data.token);
      toast.success("Account created");
      navigate("/dashboard", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-lg rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="mb-6">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-mint text-white">
            <UserPlus className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-ink">Create account</h1>
          <p className="mt-1 text-sm text-slate-600">Create your account to continue.</p>
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-ink">First name</span>
            <input
              className="focus-ring mt-1 block h-11 w-full rounded-md border border-line px-3 text-ink"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">Last name</span>
            <input
              className="focus-ring mt-1 block h-11 w-full rounded-md border border-line px-3 text-ink"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-ink">Email</span>
            <input
              className="focus-ring mt-1 block h-11 w-full rounded-md border border-line px-3 text-ink"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-ink">Password</span>
            <input
              className="focus-ring mt-1 block h-11 w-full rounded-md border border-line px-3 text-ink"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="focus-ring inline-flex h-11 items-center justify-center rounded-md bg-mint px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link className="font-medium text-brand hover:text-blue-700" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Register;
