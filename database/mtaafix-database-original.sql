--
-- PostgreSQL database dump
--

\restrict oAO1QNsU4GyxeswIOQ1FM1Qq6J4eaptS5QAfDCbRIMcZjQ5Hd0cxDDEcUC8tYuN

-- Dumped from database version 17.11 (Homebrew)
-- Dumped by pg_dump version 17.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: authorities; Type: TABLE; Schema: public; Owner: minhajjminhajj
--

CREATE TABLE public.authorities (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    authority_type character varying(100),
    contact_email character varying(150),
    contact_phone character varying(30),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    contact_person character varying(150),
    address text,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.authorities OWNER TO minhajjminhajj;

--
-- Name: authorities_id_seq; Type: SEQUENCE; Schema: public; Owner: minhajjminhajj
--

CREATE SEQUENCE public.authorities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.authorities_id_seq OWNER TO minhajjminhajj;

--
-- Name: authorities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhajjminhajj
--

ALTER SEQUENCE public.authorities_id_seq OWNED BY public.authorities.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: minhajjminhajj
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO minhajjminhajj;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: minhajjminhajj
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO minhajjminhajj;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhajjminhajj
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: incidents; Type: TABLE; Schema: public; Owner: minhajjminhajj
--

CREATE TABLE public.incidents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id integer,
    title character varying(200),
    description text,
    latitude numeric(10,7),
    longitude numeric(10,7),
    status character varying(30) DEFAULT 'open'::character varying,
    priority character varying(20) DEFAULT 'normal'::character varying,
    report_count integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    authority_id integer,
    problem_type_id integer,
    accepted_at timestamp without time zone,
    work_started_at timestamp without time zone,
    resolution_note text,
    resolution_submitted_at timestamp without time zone,
    CONSTRAINT incidents_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT incidents_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'under_review'::character varying, 'assigned'::character varying, 'in_progress'::character varying, 'resolution_submitted'::character varying, 'resolved'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.incidents OWNER TO minhajjminhajj;

--
-- Name: problem_types; Type: TABLE; Schema: public; Owner: minhajjminhajj
--

CREATE TABLE public.problem_types (
    id integer NOT NULL,
    category_id integer NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    default_priority character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    safety_message text,
    emergency_contact_recommended boolean DEFAULT false,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT problem_types_default_priority_check CHECK (((default_priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'critical'::character varying])::text[])))
);


ALTER TABLE public.problem_types OWNER TO minhajjminhajj;

--
-- Name: problem_types_id_seq; Type: SEQUENCE; Schema: public; Owner: minhajjminhajj
--

CREATE SEQUENCE public.problem_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.problem_types_id_seq OWNER TO minhajjminhajj;

--
-- Name: problem_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhajjminhajj
--

ALTER SEQUENCE public.problem_types_id_seq OWNED BY public.problem_types.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: minhajjminhajj
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    category_id integer,
    incident_id uuid,
    description text NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    problem_type_id integer
);


ALTER TABLE public.reports OWNER TO minhajjminhajj;

--
-- Name: routing_rules; Type: TABLE; Schema: public; Owner: minhajjminhajj
--

CREATE TABLE public.routing_rules (
    id integer NOT NULL,
    category_id integer NOT NULL,
    authority_id integer NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.routing_rules OWNER TO minhajjminhajj;

--
-- Name: routing_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: minhajjminhajj
--

CREATE SEQUENCE public.routing_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.routing_rules_id_seq OWNER TO minhajjminhajj;

--
-- Name: routing_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhajjminhajj
--

ALTER SEQUENCE public.routing_rules_id_seq OWNED BY public.routing_rules.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: minhajjminhajj
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(150) NOT NULL,
    phone character varying(30),
    email character varying(150),
    password_hash text NOT NULL,
    role character varying(30) DEFAULT 'citizen'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    authority_id integer,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['citizen'::character varying, 'admin'::character varying, 'super_admin'::character varying, 'service_provider'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO minhajjminhajj;

--
-- Name: authorities id; Type: DEFAULT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.authorities ALTER COLUMN id SET DEFAULT nextval('public.authorities_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: problem_types id; Type: DEFAULT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.problem_types ALTER COLUMN id SET DEFAULT nextval('public.problem_types_id_seq'::regclass);


--
-- Name: routing_rules id; Type: DEFAULT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.routing_rules ALTER COLUMN id SET DEFAULT nextval('public.routing_rules_id_seq'::regclass);


--
-- Data for Name: authorities; Type: TABLE DATA; Schema: public; Owner: minhajjminhajj
--

COPY public.authorities (id, name, authority_type, contact_email, contact_phone, created_at, contact_person, address, is_active, updated_at) FROM stdin;
1	Road Infrastructure Unit	Road Maintenance	\N	\N	2026-09-24 19:58:22.176149	\N	\N	t	2026-10-08 11:02:51.582866
2	Water Services Unit	Water Infrastructure	\N	\N	2026-09-24 19:58:22.176149	\N	\N	t	2026-10-08 11:02:51.582866
3	Municipal Engineering Unit	Drainage and Engineering	\N	\N	2026-09-24 19:58:22.176149	\N	\N	t	2026-10-08 11:02:51.582866
4	Waste Management Unit	Waste and Environment	\N	\N	2026-09-24 19:58:22.176149	\N	\N	t	2026-10-08 11:02:51.582866
6	General Municipal Services	General Services	\N	\N	2026-09-24 19:58:22.176149	\N	\N	t	2026-10-08 11:02:51.582866
5	Electrical and Streetlight Unit	Streetlight Infrastructure	electrical@mtaafix.test	0755000005	2026-09-24 19:58:22.176149	James Mollel	Municipal Electrical Services Office	t	2026-10-08 11:19:31.271581
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: minhajjminhajj
--

COPY public.categories (id, name, description, created_at) FROM stdin;
1	Pothole	Damaged road surface or pothole	2026-09-23 09:06:08.373414
2	Water Leak	Burst pipe or visible water leakage	2026-09-23 09:06:08.373414
3	Drainage	Blocked or damaged drainage infrastructure	2026-09-23 09:06:08.373414
4	Waste	Uncollected or illegally dumped waste	2026-09-23 09:06:08.373414
5	Streetlight	Broken or non-functioning streetlight	2026-09-23 09:06:08.373414
6	Other	Other physical community infrastructure issue	2026-09-23 09:06:08.373414
\.


--
-- Data for Name: incidents; Type: TABLE DATA; Schema: public; Owner: minhajjminhajj
--

COPY public.incidents (id, category_id, title, description, latitude, longitude, status, priority, report_count, created_at, updated_at, authority_id, problem_type_id, accepted_at, work_started_at, resolution_note, resolution_submitted_at) FROM stdin;
31d50537-e95e-436b-8c80-31ccaa2440cb	2	Water Leak Incident	Burst water pipe causing flooding on the road	-6.1700000	35.7600000	in_progress	high	1	2026-09-24 19:59:54.884635	2026-09-24 20:01:43.745645	2	\N	\N	\N	\N	\N
365bbabd-bc84-4058-a244-c95d35205202	1	Pothole Incident	Large pothole damaging vehicles on the road	-6.1630000	35.7516000	open	high	3	2026-09-24 18:05:30.935177	2026-09-24 19:57:28.07512	1	\N	\N	\N	\N	\N
c29a9b5b-582e-4e95-9f34-454fb1d03827	5	Streetlight Incident	Broken streetlight leaving this road completely dark at night	-6.1800000	35.7800000	open	low	1	2026-09-25 17:45:41.463388	2026-09-25 17:45:41.463388	5	\N	\N	\N	\N	\N
eea48b6f-835e-4f74-8bfe-05c1bcf97bad	1	Small Pothole	Small pothole causing minor difficulty for road users.	-6.1700000	35.7600000	open	low	1	2026-09-28 11:16:43.440362	2026-09-28 11:16:43.440362	1	1	\N	\N	\N	\N
33c612e5-962e-4ee5-8fc2-833e7ca0f97e	5	Sparking or Shorting Electrical Wire	Electrical wire problem reported on the road	-6.1630000	35.7516000	resolved	critical	1	2026-09-28 11:15:00.137285	2026-10-08 12:03:00.06464	5	19	2026-10-08 11:48:23.979663	2026-10-08 11:49:49.841394	Electrical fault repaired and exposed wire secured.	2026-10-08 11:50:47.568303
\.


--
-- Data for Name: problem_types; Type: TABLE DATA; Schema: public; Owner: minhajjminhajj
--

COPY public.problem_types (id, category_id, name, description, default_priority, safety_message, emergency_contact_recommended, active, created_at) FROM stdin;
1	1	Small Pothole	\N	low	\N	f	t	2026-09-28 11:01:47.448176
2	1	Large or Deep Pothole	\N	high	Use caution when approaching the affected road section.	f	t	2026-09-28 11:01:47.448176
3	1	Road Obstruction or Dangerous Road Damage	\N	high	Avoid the affected section where possible.	t	t	2026-09-28 11:01:47.448176
4	2	Minor Water Leak	\N	normal	\N	f	t	2026-09-28 11:01:47.448176
5	2	Burst Water Pipe	\N	high	Avoid flooded or damaged areas around the burst pipe.	t	t	2026-09-28 11:01:47.448176
6	2	Major Water Flooding	\N	high	Keep away from heavily flooded infrastructure areas.	t	t	2026-09-28 11:01:47.448176
7	2	Suspected Contaminated Water	\N	critical	Do not drink or come into contact with suspected contaminated water.	t	t	2026-09-28 11:01:47.448176
8	3	Blocked Drainage	\N	normal	\N	f	t	2026-09-28 11:01:47.448176
9	3	Overflowing Drainage	\N	high	Avoid contact with overflowing drainage water.	t	t	2026-09-28 11:01:47.448176
10	3	Sewage Overflow	\N	critical	Avoid direct contact with sewage and keep children away from the affected area.	t	t	2026-09-28 11:01:47.448176
11	3	Drainage Causing Road Flooding	\N	high	Use caution and avoid crossing heavily flooded sections.	t	t	2026-09-28 11:01:47.448176
12	4	Uncollected Waste	\N	normal	\N	f	t	2026-09-28 11:01:47.448176
13	4	Large Illegal Dumping	\N	high	Avoid direct contact with unknown dumped materials.	f	t	2026-09-28 11:01:47.448176
14	4	Hazardous or Medical Waste	\N	critical	Do not touch suspected hazardous or medical waste.	t	t	2026-09-28 11:01:47.448176
15	5	Streetlight Not Working	\N	low	\N	f	t	2026-09-28 11:01:47.448176
16	5	Damaged Electrical Pole	\N	high	Keep a safe distance from the damaged electrical infrastructure.	t	t	2026-09-28 11:01:47.448176
17	5	Fallen Electrical Pole	\N	critical	Keep away from the fallen pole and any nearby wires.	t	t	2026-09-28 11:01:47.448176
18	5	Exposed Electrical Wire	\N	critical	Do not approach or touch the exposed electrical wire.	t	t	2026-09-28 11:01:47.448176
19	5	Sparking or Shorting Electrical Wire	\N	critical	Keep a safe distance from the electrical hazard.	t	t	2026-09-28 11:01:47.448176
20	6	Other Infrastructure Issue	\N	normal	\N	f	t	2026-09-28 11:01:47.448176
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: minhajjminhajj
--

COPY public.reports (id, user_id, category_id, incident_id, description, latitude, longitude, image_url, created_at, problem_type_id) FROM stdin;
437decb2-8a66-48e0-b239-ce97898e0d90	79ea227b-58c8-46c5-af44-344b2eb0f47d	1	365bbabd-bc84-4058-a244-c95d35205202	Large pothole damaging vehicles on the road	-6.1630000	35.7516000	\N	2026-09-24 18:05:30.935177	\N
8423da12-0a54-43e4-8416-56f2e8507792	79ea227b-58c8-46c5-af44-344b2eb0f47d	1	365bbabd-bc84-4058-a244-c95d35205202	There is a dangerous pothole here, several cars are avoiding it	-6.1630500	35.7516500	\N	2026-09-24 18:06:33.196983	\N
3fd22b7f-8159-4fe9-9c0c-7a1c3c734cf7	79ea227b-58c8-46c5-af44-344b2eb0f47d	1	365bbabd-bc84-4058-a244-c95d35205202	Dangerous pothole causing accidents and damaging vehicles	-6.1630400	35.7516200	\N	2026-09-24 19:57:28.07512	\N
afe61838-edfa-474f-91fe-c190d736a15c	79ea227b-58c8-46c5-af44-344b2eb0f47d	2	31d50537-e95e-436b-8c80-31ccaa2440cb	Burst water pipe causing flooding on the road	-6.1700000	35.7600000	\N	2026-09-24 19:59:54.884635	\N
122a6455-3226-40bf-8cd5-254348505b4d	79ea227b-58c8-46c5-af44-344b2eb0f47d	5	c29a9b5b-582e-4e95-9f34-454fb1d03827	Broken streetlight leaving this road completely dark at night	-6.1800000	35.7800000	\N	2026-09-25 17:45:41.463388	\N
9464de2b-d75b-45b8-8d3f-d1b459d16e0b	79ea227b-58c8-46c5-af44-344b2eb0f47d	5	33c612e5-962e-4ee5-8fc2-833e7ca0f97e	Electrical wire problem reported on the road	-6.1630000	35.7516000	/uploads/reports/1790583300120-2a88c60b-a87e-4934-ad6f-3f899d4382eb.jpg	2026-09-28 11:15:00.137285	19
422ad3dc-f33e-4114-833c-4ec643b222c1	79ea227b-58c8-46c5-af44-344b2eb0f47d	1	eea48b6f-835e-4f74-8bfe-05c1bcf97bad	There is a VERY DANGEROUS pothole causing accidents and serious danger	-6.1700000	35.7600000	/uploads/reports/1790583403427-7ca209d2-f3fb-4010-bb92-e5322a03538f.jpg	2026-09-28 11:16:43.440362	1
\.


--
-- Data for Name: routing_rules; Type: TABLE DATA; Schema: public; Owner: minhajjminhajj
--

COPY public.routing_rules (id, category_id, authority_id, active, created_at) FROM stdin;
1	1	1	t	2026-09-24 19:58:29.97027
2	2	2	t	2026-09-24 19:58:29.97027
3	3	3	t	2026-09-24 19:58:29.97027
4	4	4	t	2026-09-24 19:58:29.97027
5	5	5	t	2026-09-24 19:58:29.97027
6	6	6	t	2026-09-24 19:58:29.97027
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: minhajjminhajj
--

COPY public.users (id, full_name, phone, email, password_hash, role, created_at, updated_at, authority_id, is_active) FROM stdin;
79ea227b-58c8-46c5-af44-344b2eb0f47d	Minhajj Test	0712345678	minhajj@mtaafix.test	$2b$12$JEiZbjc2ktLSd..rCLj8vecnf5sTylVhmk4OY4584RnnF1uqxc.qe	citizen	2026-09-23 09:22:57.280623	2026-09-23 09:22:57.280623	\N	t
7c84fbf2-3067-49da-86b4-f90c5f0a4abd	MtaaFix Administrator	\N	admin@mtaafix.test	$2b$12$3Mbk6/D1CUjqoO1eiSMyQuLtgMI/L8UhQ4vn7hsOT.SQSIDjceTyO	super_admin	2026-09-28 11:53:05.359335	2026-10-08 11:05:01.931941	\N	t
67dbe805-427e-49f9-ba47-c8def6e0212c	Electrical Services Officer	0755000005	electrical@mtaafix.test	$2b$12$fUTUWdzSPicZ0iFraI6RYeW2tfIp5B9BM/GR/ONejyuWdQfHS5lca	service_provider	2026-10-08 11:19:37.589087	2026-10-08 11:31:59.298104	5	t
\.


--
-- Name: authorities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: minhajjminhajj
--

SELECT pg_catalog.setval('public.authorities_id_seq', 6, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: minhajjminhajj
--

SELECT pg_catalog.setval('public.categories_id_seq', 6, true);


--
-- Name: problem_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: minhajjminhajj
--

SELECT pg_catalog.setval('public.problem_types_id_seq', 20, true);


--
-- Name: routing_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: minhajjminhajj
--

SELECT pg_catalog.setval('public.routing_rules_id_seq', 6, true);


--
-- Name: authorities authorities_pkey; Type: CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.authorities
    ADD CONSTRAINT authorities_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: problem_types problem_types_category_id_name_key; Type: CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.problem_types
    ADD CONSTRAINT problem_types_category_id_name_key UNIQUE (category_id, name);


--
-- Name: problem_types problem_types_pkey; Type: CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.problem_types
    ADD CONSTRAINT problem_types_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: routing_rules routing_rules_category_id_authority_id_key; Type: CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.routing_rules
    ADD CONSTRAINT routing_rules_category_id_authority_id_key UNIQUE (category_id, authority_id);


--
-- Name: routing_rules routing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.routing_rules
    ADD CONSTRAINT routing_rules_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_incidents_problem_type_id; Type: INDEX; Schema: public; Owner: minhajjminhajj
--

CREATE INDEX idx_incidents_problem_type_id ON public.incidents USING btree (problem_type_id);


--
-- Name: idx_reports_problem_type_id; Type: INDEX; Schema: public; Owner: minhajjminhajj
--

CREATE INDEX idx_reports_problem_type_id ON public.reports USING btree (problem_type_id);


--
-- Name: incidents incidents_authority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_authority_id_fkey FOREIGN KEY (authority_id) REFERENCES public.authorities(id);


--
-- Name: incidents incidents_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: incidents incidents_problem_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_problem_type_id_fkey FOREIGN KEY (problem_type_id) REFERENCES public.problem_types(id);


--
-- Name: problem_types problem_types_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.problem_types
    ADD CONSTRAINT problem_types_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: reports reports_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: reports reports_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id);


--
-- Name: reports reports_problem_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_problem_type_id_fkey FOREIGN KEY (problem_type_id) REFERENCES public.problem_types(id);


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: routing_rules routing_rules_authority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.routing_rules
    ADD CONSTRAINT routing_rules_authority_id_fkey FOREIGN KEY (authority_id) REFERENCES public.authorities(id);


--
-- Name: routing_rules routing_rules_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.routing_rules
    ADD CONSTRAINT routing_rules_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: users users_authority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhajjminhajj
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_authority_id_fkey FOREIGN KEY (authority_id) REFERENCES public.authorities(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict oAO1QNsU4GyxeswIOQ1FM1Qq6J4eaptS5QAfDCbRIMcZjQ5Hd0cxDDEcUC8tYuN

