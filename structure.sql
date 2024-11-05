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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: active_storage_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_storage_attachments (
    id bigint NOT NULL,
    name character varying NOT NULL,
    record_type character varying NOT NULL,
    record_id bigint NOT NULL,
    blob_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: active_storage_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.active_storage_attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: active_storage_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.active_storage_attachments_id_seq OWNED BY public.active_storage_attachments.id;


--
-- Name: active_storage_blobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_storage_blobs (
    id bigint NOT NULL,
    key character varying NOT NULL,
    filename character varying NOT NULL,
    content_type character varying,
    metadata text,
    service_name character varying NOT NULL,
    byte_size bigint NOT NULL,
    checksum character varying,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: active_storage_blobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.active_storage_blobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: active_storage_blobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.active_storage_blobs_id_seq OWNED BY public.active_storage_blobs.id;


--
-- Name: active_storage_variant_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_storage_variant_records (
    id bigint NOT NULL,
    blob_id bigint NOT NULL,
    variation_digest character varying NOT NULL
);


--
-- Name: active_storage_variant_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.active_storage_variant_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: active_storage_variant_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.active_storage_variant_records_id_seq OWNED BY public.active_storage_variant_records.id;


--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id bigint NOT NULL,
    email character varying DEFAULT ''::character varying NOT NULL,
    encrypted_password character varying DEFAULT ''::character varying NOT NULL,
    reset_password_token character varying,
    reset_password_sent_at timestamp(6) without time zone,
    remember_created_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    role integer DEFAULT 0
);


--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: api_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_users (
    id bigint NOT NULL,
    name character varying,
    token character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: api_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_users_id_seq OWNED BY public.api_users.id;


--
-- Name: ar_internal_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_internal_metadata (
    key character varying NOT NULL,
    value character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: banks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banks (
    id bigint NOT NULL,
    name character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    account_info_schema json,
    color character varying
);


--
-- Name: banks_fiat_currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banks_fiat_currencies (
    bank_id bigint NOT NULL,
    fiat_currency_id bigint NOT NULL
);


--
-- Name: banks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.banks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: banks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.banks_id_seq OWNED BY public.banks.id;


--
-- Name: cancellation_reasons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cancellation_reasons (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    reason text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: cancellation_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cancellation_reasons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cancellation_reasons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cancellation_reasons_id_seq OWNED BY public.cancellation_reasons.id;


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    chain_id integer,
    address character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    version character varying
);


--
-- Name: contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contracts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contracts_id_seq OWNED BY public.contracts.id;


--
-- Name: dispute_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dispute_files (
    id bigint NOT NULL,
    user_dispute_id bigint NOT NULL,
    filename character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: dispute_files_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dispute_files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dispute_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dispute_files_id_seq OWNED BY public.dispute_files.id;


--
-- Name: disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disputes (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    resolved boolean DEFAULT false NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    winner_id bigint
);


--
-- Name: disputes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.disputes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: disputes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.disputes_id_seq OWNED BY public.disputes.id;


--
-- Name: escrows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.escrows (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    tx character varying,
    address character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: escrows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.escrows_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: escrows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.escrows_id_seq OWNED BY public.escrows.id;


--
-- Name: fiat_currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fiat_currencies (
    id bigint NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    symbol character varying,
    country_code character varying,
    "position" integer,
    allow_binance_rates boolean DEFAULT false,
    default_price_source integer DEFAULT 0
);


--
-- Name: fiat_currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fiat_currencies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fiat_currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fiat_currencies_id_seq OWNED BY public.fiat_currencies.id;


--
-- Name: lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lists (
    id bigint NOT NULL,
    chain_id integer NOT NULL,
    seller_id bigint NOT NULL,
    token_id bigint NOT NULL,
    fiat_currency_id bigint NOT NULL,
    total_available_amount numeric,
    limit_min numeric,
    limit_max numeric,
    margin_type integer DEFAULT 0 NOT NULL,
    margin numeric NOT NULL,
    terms text,
    automatic_approval boolean DEFAULT true,
    status integer DEFAULT 0,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    payment_method_id bigint,
    type character varying,
    bank_id bigint,
    deposit_time_limit integer,
    payment_time_limit integer,
    accept_only_verified boolean DEFAULT false,
    escrow_type integer DEFAULT 0,
    price_source integer DEFAULT 0
);


--
-- Name: lists_banks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lists_banks (
    list_id bigint NOT NULL,
    bank_id bigint NOT NULL
);


--
-- Name: lists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lists_id_seq OWNED BY public.lists.id;


--
-- Name: lists_payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lists_payment_methods (
    list_id bigint NOT NULL,
    payment_method_id bigint NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    list_id bigint NOT NULL,
    buyer_id bigint NOT NULL,
    fiat_amount numeric NOT NULL,
    status integer DEFAULT 0,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    token_amount numeric,
    price numeric,
    uuid character varying,
    cancelled_by_id bigint,
    cancelled_at timestamp(6) without time zone,
    trade_id character varying,
    seller_id bigint NOT NULL,
    payment_method_id bigint NOT NULL,
    deposit_time_limit integer,
    payment_time_limit integer,
    chain_id integer NOT NULL
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: orders_payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders_payment_methods (
    payment_method_id bigint NOT NULL,
    order_id bigint NOT NULL
);


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_methods (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    bank_id bigint,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    "values" json,
    type character varying NOT NULL
);


--
-- Name: payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_methods_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id bigint NOT NULL,
    name character varying NOT NULL,
    value text NOT NULL,
    description text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tokens (
    id bigint NOT NULL,
    address character varying NOT NULL,
    decimals integer NOT NULL,
    symbol character varying NOT NULL,
    name character varying,
    chain_id integer NOT NULL,
    coingecko_id character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    coinmarketcap_id character varying,
    gasless boolean DEFAULT false,
    "position" integer,
    minimum_amount numeric,
    allow_binance_rates boolean DEFAULT false
);


--
-- Name: tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tokens_id_seq OWNED BY public.tokens.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    tx_hash character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: user_disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_disputes (
    id bigint NOT NULL,
    dispute_id bigint NOT NULL,
    user_id bigint NOT NULL,
    comments text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: user_disputes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_disputes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_disputes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_disputes_id_seq OWNED BY public.user_disputes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    address character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    email character varying,
    name character varying,
    twitter character varying,
    image character varying,
    verified boolean DEFAULT false,
    merchant boolean DEFAULT false,
    timezone character varying,
    available_from integer,
    available_to integer,
    weekend_offline boolean DEFAULT false
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: active_storage_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_attachments ALTER COLUMN id SET DEFAULT nextval('public.active_storage_attachments_id_seq'::regclass);


--
-- Name: active_storage_blobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_blobs ALTER COLUMN id SET DEFAULT nextval('public.active_storage_blobs_id_seq'::regclass);


--
-- Name: active_storage_variant_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_variant_records ALTER COLUMN id SET DEFAULT nextval('public.active_storage_variant_records_id_seq'::regclass);


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: api_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_users ALTER COLUMN id SET DEFAULT nextval('public.api_users_id_seq'::regclass);


--
-- Name: banks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banks ALTER COLUMN id SET DEFAULT nextval('public.banks_id_seq'::regclass);


--
-- Name: cancellation_reasons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_reasons ALTER COLUMN id SET DEFAULT nextval('public.cancellation_reasons_id_seq'::regclass);


--
-- Name: contracts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts ALTER COLUMN id SET DEFAULT nextval('public.contracts_id_seq'::regclass);


--
-- Name: dispute_files id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_files ALTER COLUMN id SET DEFAULT nextval('public.dispute_files_id_seq'::regclass);


--
-- Name: disputes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes ALTER COLUMN id SET DEFAULT nextval('public.disputes_id_seq'::regclass);


--
-- Name: escrows id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrows ALTER COLUMN id SET DEFAULT nextval('public.escrows_id_seq'::regclass);


--
-- Name: fiat_currencies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiat_currencies ALTER COLUMN id SET DEFAULT nextval('public.fiat_currencies_id_seq'::regclass);


--
-- Name: lists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists ALTER COLUMN id SET DEFAULT nextval('public.lists_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens ALTER COLUMN id SET DEFAULT nextval('public.tokens_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: user_disputes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_disputes ALTER COLUMN id SET DEFAULT nextval('public.user_disputes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: active_storage_attachments active_storage_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_attachments
    ADD CONSTRAINT active_storage_attachments_pkey PRIMARY KEY (id);


--
-- Name: active_storage_blobs active_storage_blobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_blobs
    ADD CONSTRAINT active_storage_blobs_pkey PRIMARY KEY (id);


--
-- Name: active_storage_variant_records active_storage_variant_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_variant_records
    ADD CONSTRAINT active_storage_variant_records_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: api_users api_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_users
    ADD CONSTRAINT api_users_pkey PRIMARY KEY (id);


--
-- Name: ar_internal_metadata ar_internal_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_internal_metadata
    ADD CONSTRAINT ar_internal_metadata_pkey PRIMARY KEY (key);


--
-- Name: banks banks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banks
    ADD CONSTRAINT banks_pkey PRIMARY KEY (id);


--
-- Name: cancellation_reasons cancellation_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_reasons
    ADD CONSTRAINT cancellation_reasons_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: dispute_files dispute_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_files
    ADD CONSTRAINT dispute_files_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: escrows escrows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrows
    ADD CONSTRAINT escrows_pkey PRIMARY KEY (id);


--
-- Name: fiat_currencies fiat_currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiat_currencies
    ADD CONSTRAINT fiat_currencies_pkey PRIMARY KEY (id);


--
-- Name: lists lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_disputes user_disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_disputes
    ADD CONSTRAINT user_disputes_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: index_active_storage_attachments_on_blob_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_active_storage_attachments_on_blob_id ON public.active_storage_attachments USING btree (blob_id);


--
-- Name: index_active_storage_attachments_uniqueness; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_active_storage_attachments_uniqueness ON public.active_storage_attachments USING btree (record_type, record_id, name, blob_id);


--
-- Name: index_active_storage_blobs_on_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_active_storage_blobs_on_key ON public.active_storage_blobs USING btree (key);


--
-- Name: index_active_storage_variant_records_uniqueness; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_active_storage_variant_records_uniqueness ON public.active_storage_variant_records USING btree (blob_id, variation_digest);


--
-- Name: index_admin_users_on_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_admin_users_on_email ON public.admin_users USING btree (email);


--
-- Name: index_admin_users_on_reset_password_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_admin_users_on_reset_password_token ON public.admin_users USING btree (reset_password_token);


--
-- Name: index_banks_fiat_currencies_on_bank_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_banks_fiat_currencies_on_bank_id ON public.banks_fiat_currencies USING btree (bank_id);


--
-- Name: index_banks_fiat_currencies_on_bank_id_and_fiat_currency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_banks_fiat_currencies_on_bank_id_and_fiat_currency_id ON public.banks_fiat_currencies USING btree (bank_id, fiat_currency_id);


--
-- Name: index_banks_fiat_currencies_on_fiat_currency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_banks_fiat_currencies_on_fiat_currency_id ON public.banks_fiat_currencies USING btree (fiat_currency_id);


--
-- Name: index_cancellation_reasons_on_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_cancellation_reasons_on_order_id ON public.cancellation_reasons USING btree (order_id);


--
-- Name: index_contracts_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_contracts_on_user_id ON public.contracts USING btree (user_id);


--
-- Name: index_contracts_on_user_id_and_chain_id_and_address; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_contracts_on_user_id_and_chain_id_and_address ON public.contracts USING btree (user_id, chain_id, address);


--
-- Name: index_contracts_on_user_id_and_chain_id_and_address_and_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_contracts_on_user_id_and_chain_id_and_address_and_version ON public.contracts USING btree (user_id, chain_id, address, version);


--
-- Name: index_dispute_files_on_user_dispute_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_dispute_files_on_user_dispute_id ON public.dispute_files USING btree (user_dispute_id);


--
-- Name: index_disputes_on_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_disputes_on_order_id ON public.disputes USING btree (order_id);


--
-- Name: index_disputes_on_winner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_disputes_on_winner_id ON public.disputes USING btree (winner_id);


--
-- Name: index_escrows_on_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_escrows_on_order_id ON public.escrows USING btree (order_id);


--
-- Name: index_lists_banks_on_bank_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_lists_banks_on_bank_id ON public.lists_banks USING btree (bank_id);


--
-- Name: index_lists_banks_on_list_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_lists_banks_on_list_id ON public.lists_banks USING btree (list_id);


--
-- Name: index_lists_banks_on_list_id_and_bank_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_lists_banks_on_list_id_and_bank_id ON public.lists_banks USING btree (list_id, bank_id);


--
-- Name: index_lists_on_bank_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_lists_on_bank_id ON public.lists USING btree (bank_id);


--
-- Name: index_lists_on_chain_id_and_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_lists_on_chain_id_and_seller_id ON public.lists USING btree (chain_id, seller_id);


--
-- Name: index_lists_on_fiat_currency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_lists_on_fiat_currency_id ON public.lists USING btree (fiat_currency_id);


--
-- Name: index_lists_on_payment_method_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_lists_on_payment_method_id ON public.lists USING btree (payment_method_id);


--
-- Name: index_lists_on_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_lists_on_seller_id ON public.lists USING btree (seller_id);


--
-- Name: index_lists_on_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_lists_on_token_id ON public.lists USING btree (token_id);


--
-- Name: index_lists_on_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_lists_on_type ON public.lists USING btree (type);


--
-- Name: index_lists_payment_methods_on_list_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_lists_payment_methods_on_list_id ON public.lists_payment_methods USING btree (list_id);


--
-- Name: index_lists_payment_methods_on_list_id_and_payment_method_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_lists_payment_methods_on_list_id_and_payment_method_id ON public.lists_payment_methods USING btree (list_id, payment_method_id);


--
-- Name: index_lists_payment_methods_on_payment_method_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_lists_payment_methods_on_payment_method_id ON public.lists_payment_methods USING btree (payment_method_id);


--
-- Name: index_orders_on_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_orders_on_buyer_id ON public.orders USING btree (buyer_id);


--
-- Name: index_orders_on_cancelled_by_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_orders_on_cancelled_by_id ON public.orders USING btree (cancelled_by_id);


--
-- Name: index_orders_on_list_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_orders_on_list_id ON public.orders USING btree (list_id);


--
-- Name: index_orders_on_payment_method_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_orders_on_payment_method_id ON public.orders USING btree (payment_method_id);


--
-- Name: index_orders_on_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_orders_on_seller_id ON public.orders USING btree (seller_id);


--
-- Name: index_orders_payment_methods_on_order_id_and_payment_method_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_orders_payment_methods_on_order_id_and_payment_method_id ON public.orders_payment_methods USING btree (order_id, payment_method_id);


--
-- Name: index_orders_payment_methods_on_payment_method_id_and_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_orders_payment_methods_on_payment_method_id_and_order_id ON public.orders_payment_methods USING btree (payment_method_id, order_id);


--
-- Name: index_payment_methods_on_bank_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_payment_methods_on_bank_id ON public.payment_methods USING btree (bank_id);


--
-- Name: index_payment_methods_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_payment_methods_on_user_id ON public.payment_methods USING btree (user_id);


--
-- Name: index_settings_on_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_settings_on_name ON public.settings USING btree (name);


--
-- Name: index_tokens_on_lower_address_chain_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_tokens_on_lower_address_chain_id ON public.tokens USING btree (lower((address)::text), chain_id);


--
-- Name: index_transactions_on_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_transactions_on_order_id ON public.transactions USING btree (order_id);


--
-- Name: index_user_disputes_on_dispute_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_user_disputes_on_dispute_id ON public.user_disputes USING btree (dispute_id);


--
-- Name: index_user_disputes_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_user_disputes_on_user_id ON public.user_disputes USING btree (user_id);


--
-- Name: index_users_on_lower_address; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_lower_address ON public.users USING btree (lower((address)::text));


--
-- Name: index_users_on_merchant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_users_on_merchant ON public.users USING btree (merchant);


--
-- Name: index_users_on_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_name ON public.users USING btree (name);


--
-- Name: user_disputes fk_rails_309ce81f59; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_disputes
    ADD CONSTRAINT fk_rails_309ce81f59 FOREIGN KEY (dispute_id) REFERENCES public.disputes(id);


--
-- Name: transactions fk_rails_59d791a33f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_rails_59d791a33f FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: banks_fiat_currencies fk_rails_81fdada4cd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banks_fiat_currencies
    ADD CONSTRAINT fk_rails_81fdada4cd FOREIGN KEY (bank_id) REFERENCES public.banks(id);


--
-- Name: active_storage_variant_records fk_rails_993965df05; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_variant_records
    ADD CONSTRAINT fk_rails_993965df05 FOREIGN KEY (blob_id) REFERENCES public.active_storage_blobs(id);


--
-- Name: lists_banks fk_rails_bcb43b6f0f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists_banks
    ADD CONSTRAINT fk_rails_bcb43b6f0f FOREIGN KEY (list_id) REFERENCES public.lists(id);


--
-- Name: user_disputes fk_rails_bcbc3ef217; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_disputes
    ADD CONSTRAINT fk_rails_bcbc3ef217 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: lists fk_rails_be46e93227; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT fk_rails_be46e93227 FOREIGN KEY (bank_id) REFERENCES public.banks(id);


--
-- Name: active_storage_attachments fk_rails_c3b3935057; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_attachments
    ADD CONSTRAINT fk_rails_c3b3935057 FOREIGN KEY (blob_id) REFERENCES public.active_storage_blobs(id);


--
-- Name: cancellation_reasons fk_rails_cde01d34c0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_reasons
    ADD CONSTRAINT fk_rails_cde01d34c0 FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: lists_banks fk_rails_cf72aa41a5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists_banks
    ADD CONSTRAINT fk_rails_cf72aa41a5 FOREIGN KEY (bank_id) REFERENCES public.banks(id);


--
-- Name: banks_fiat_currencies fk_rails_d04f698091; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banks_fiat_currencies
    ADD CONSTRAINT fk_rails_d04f698091 FOREIGN KEY (fiat_currency_id) REFERENCES public.fiat_currencies(id);


--
-- Name: lists_payment_methods fk_rails_d537bc71da; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists_payment_methods
    ADD CONSTRAINT fk_rails_d537bc71da FOREIGN KEY (list_id) REFERENCES public.lists(id);


--
-- Name: lists_payment_methods fk_rails_d96ca8b4e9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists_payment_methods
    ADD CONSTRAINT fk_rails_d96ca8b4e9 FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- Name: dispute_files fk_rails_dd1d5e9f2d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_files
    ADD CONSTRAINT fk_rails_dd1d5e9f2d FOREIGN KEY (user_dispute_id) REFERENCES public.user_disputes(id);


--
-- Name: orders fk_rails_e0b14989f1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_rails_e0b14989f1 FOREIGN KEY (cancelled_by_id) REFERENCES public.users(id);


--
-- Name: disputes fk_rails_e3476f3838; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT fk_rails_e3476f3838 FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: escrows fk_rails_e352d4d48f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escrows
    ADD CONSTRAINT fk_rails_e352d4d48f FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: contracts fk_rails_f191b5ed7a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT fk_rails_f191b5ed7a FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders fk_rails_f569184c98; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_rails_f569184c98 FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: disputes fk_rails_f6e3de0dc3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT fk_rails_f6e3de0dc3 FOREIGN KEY (winner_id) REFERENCES public.users(id);


--
-- Name: orders fk_rails_fa5e448daa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_rails_fa5e448daa FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- PostgreSQL database dump complete
--

SET search_path TO "$user", public;

INSERT INTO "schema_migrations" (version) VALUES
('20220603112348'),
('20221220110911'),
('20221220110920'),
('20221220110925'),
('20221220110929'),
('20221220110933'),
('20221220110936'),
('20221220110940'),
('20221222111249'),
('20221223172529'),
('20221223190648'),
('20221227140509'),
('20230102151836'),
('20230111125413'),
('20230112085438'),
('20230112085730'),
('20230112091606'),
('20230201184852'),
('20230202110800'),
('20230213132739'),
('20230222204418'),
('20230223144502'),
('20230223144503'),
('20230223144507'),
('20230303115649'),
('20230306140555'),
('20230307153906'),
('20230307162234'),
('20230309143809'),
('20230309143947'),
('20230310120535'),
('20230314121716'),
('20230317112140'),
('20230323112904'),
('20230324105846'),
('20230413124002'),
('20230413124220'),
('20230413131716'),
('20230413150040'),
('20230417101848'),
('20230511112903'),
('20230511112912'),
('20230602181458'),
('20230622150602'),
('20230622151443'),
('20230622155219'),
('20230703135521'),
('20230712111346'),
('20230712125342'),
('20230719103247'),
('20230721121931'),
('20230721122000'),
('20230804112525'),
('20230810111448'),
('20230810111501'),
('20230818125950'),
('20230908090556'),
('20230920115108'),
('20230921122958'),
('20231011110741'),
('20231011111448'),
('20231017092358'),
('20231024095225'),
('20231024113438'),
('20231027102713'),
('20231027103559'),
('20231030174355'),
('20231030174413'),
('20231102174234'),
('20231103133020'),
('20231103133036'),
('20231103133832'),
('20231103134022'),
('20231107112646');


