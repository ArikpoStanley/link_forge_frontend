export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export type CountryCode = string;

export interface BrandingInput {
  brand_name: string;
  brand_logo: string;
  bg_color: string;
  text_color: string;
  button_color: string;
}

export interface CheckSelection {
  phone: boolean;
  email: boolean;
  nin: boolean;
  bvn: boolean;
  bio: boolean;
  liveliness: boolean;
  document_verification: boolean;
  disclaimer: boolean;
  address_verification: boolean;
  /** Prembly Ghana meter number — Quick Address Verification */
  quick_address_verification: boolean;
}

export interface GenerateLinkRequest {
  email: string;
  phone: string;
  country: CountryCode;
  full_name?: string;
  app_id?: string;
  user_ref?: string;
  callback?: string;
  /** Where the customer is sent after KYC completes */
  redirect?: string;
  branding: BrandingInput;
  checks: CheckSelection;
}

export interface GenerateLinkResponse {
  customer_id: string;
  verification_id: string;
  verification_url: string;
  reference: string;
  todo: string[];
  total_checks: number;
  /** True when Full name was sent and stored on the Modular user for Bio prefill. */
  name_prefill?: boolean;
  name_prefill_warning?: string;
}

export interface VerificationStatusResponse {
  verification_id: string;
  status: string;
  overall_status: string;
  completed_checks: number;
  total_checks: number;
  verification_url?: string;
}
