--
-- PostgreSQL database dump
--

\restrict IPHYZZZszrlu2fKwDxyDOM1mpfeeOWd2kluRbj5FC5lC1d54eG1ixZGX7DtANeY

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ticket_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ticket_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.ticket_priority OWNER TO postgres;

--
-- Name: ticket_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ticket_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);


ALTER TYPE public.ticket_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'employee',
    'manager',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    content text NOT NULL,
    author_name text NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    icon text DEFAULT 'briefcase'::text NOT NULL,
    color text DEFAULT '#2563EB'::text NOT NULL,
    contact_email text,
    contact_phone text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status public.ticket_status DEFAULT 'open'::public.ticket_status NOT NULL,
    priority public.ticket_priority DEFAULT 'medium'::public.ticket_priority NOT NULL,
    department_id integer NOT NULL,
    created_by text NOT NULL,
    assigned_to text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    progress integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_id_seq OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    role public.user_role DEFAULT 'employee'::public.user_role NOT NULL,
    department_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, ticket_id, content, author_name, is_internal, created_at) FROM stdin;
1	3	Falta reparación prueba	Lyamm Job Castillo Cruz	f	2026-04-21 05:22:17.935911
2	4	Falta reparación prueba	Lyamm Job Castillo Cruz	f	2026-04-21 05:26:49.94316
3	4	Gracias	Admin	f	2026-04-21 05:27:41.945593
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, description, icon, color, contact_email, contact_phone, created_at) FROM stdin;
1	Sistemas / TI	Soporte técnico, redes, infraestructura y software	monitor	#1D4ED8	sistemas@empresa.com	555-0101	2026-03-23 04:38:43.302868
2	Mantenimiento	Mantenimiento de equipos, instalaciones y maquinaria	tool	#D97706	mantenimiento@empresa.com	555-0102	2026-03-23 04:38:43.327107
3	Recursos Humanos	Nómina, contrataciones, prestaciones y clima laboral	users	#7C3AED	rh@empresa.com	555-0103	2026-03-23 04:38:43.330127
4	Producción	Operaciones de planta, líneas de producción y calidad	cog	#059669	produccion@empresa.com	555-0104	2026-03-23 04:38:43.332737
5	Finanzas	Contabilidad, pagos, presupuesto y facturación	dollar-sign	#DC2626	finanzas@empresa.com	555-0105	2026-03-23 04:38:43.335822
6	Logística	Almacén, distribución, envíos y proveedores	truck	#0891B2	logistica@empresa.com	555-0106	2026-03-23 04:38:43.338533
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, title, description, status, priority, department_id, created_by, assigned_to, created_at, updated_at, progress) FROM stdin;
1	Fallo de computadoras	Ocupa actualización la computadora	closed	medium	1	Lyamm Job Castillo Cruz	\N	2026-03-23 04:50:52.333454	2026-04-21 05:18:25.278	100
2	Descompuso una computadora	En el area de IT	closed	medium	1	Lyamm Job Castillo Cruz	\N	2026-04-15 00:06:16.905848	2026-04-21 05:18:31.315	90
3	Prueba	Prueba	closed	medium	2	Lyamm Job Castillo Cruz	\N	2026-04-21 05:21:40.295888	2026-04-21 05:22:54.353	100
4	Prueba	Prueba	closed	medium	1	Lyamm Job Castillo Cruz	\N	2026-04-21 05:24:12.611079	2026-04-21 05:32:07.813	95
5	Prueba	Prueba	closed	medium	5	Lyamm Castillo	\N	2026-04-28 20:09:58.111769	2026-04-28 20:12:28.078	60
6	Prueba	Prueba	closed	medium	6	Lyamm Castillo	\N	2026-04-28 20:13:17.607009	2026-04-28 20:14:55.961	95
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, role, department_id, created_at) FROM stdin;
1	Admin Sistema	admin@empresa.com	admin	\N	2026-03-23 04:38:43.340822
2	María González	mgonzalez@empresa.com	manager	\N	2026-03-23 04:38:43.344442
3	Carlos López	clopez@empresa.com	employee	\N	2026-03-23 04:38:43.347163
4	Ana Martínez	amartinez@empresa.com	employee	\N	2026-03-23 04:38:43.35021
\.


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_id_seq', 3, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 6, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict IPHYZZZszrlu2fKwDxyDOM1mpfeeOWd2kluRbj5FC5lC1d54eG1ixZGX7DtANeY

