from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="applicant")  # applicant | lender | admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    applications = relationship("Application", back_populates="user", foreign_keys="Application.user_id")


class Lender(Base):
    __tablename__ = "lenders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    min_loan = Column(Float, default=10000)
    max_loan = Column(Float, default=500000)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    rules = relationship("LenderRule", back_populates="lender")
    applications = relationship("Application", back_populates="lender")


class LenderRule(Base):
    __tablename__ = "lender_rules"

    id = Column(Integer, primary_key=True, index=True)
    lender_id = Column(Integer, ForeignKey("lenders.id"), nullable=False)
    city_tier = Column(Integer, nullable=True)           # 1,2,3 or NULL=all
    business_types = Column(JSON, nullable=True)         # list of accepted types
    min_cibil = Column(Integer, default=600)
    max_risk_score = Column(Float, default=40.0)         # max default_probability %
    base_interest_rate = Column(Float, default=16.0)
    tier1_rate = Column(Float, default=14.0)             # metro rate
    tier2_rate = Column(Float, default=16.0)
    tier3_rate = Column(Float, default=18.0)
    max_emi_to_income = Column(Float, default=0.5)
    lender = relationship("Lender", back_populates="rules")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lender_id = Column(Integer, ForeignKey("lenders.id"), nullable=True)

    # Manual fields from form
    declared_monthly_income = Column(Float, nullable=False)
    years_in_business = Column(Float, nullable=False)
    city_tier = Column(Integer, nullable=False)
    business_type = Column(String, nullable=False)

    # User selections
    requested_loan_amount = Column(Float, nullable=True)
    selected_emi_months = Column(Integer, nullable=True)
    selected_emi_amount = Column(Float, nullable=True)
    selected_interest_rate = Column(Float, nullable=True)

    # Status
    status = Column(String, default="pending")
    # pending | ai_analyzed | lender_selected | submitted | approved | rejected | docs_requested

    # Lender action fields
    lender_note = Column(Text, nullable=True)
    modified_loan_amount = Column(Float, nullable=True)
    modified_emi = Column(Float, nullable=True)

    # Blockchain
    blockchain_tx_hash = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="applications", foreign_keys=[user_id])
    lender = relationship("Lender", back_populates="applications")
    ai_report = relationship("AIReport", back_populates="application", uselist=False)
    uploaded_files = relationship("UploadedFile", back_populates="application")
    emi_options = relationship("EMIOption", back_populates="application")
    blockchain_txns = relationship("BlockchainTransaction", back_populates="application")


class AIReport(Base):
    __tablename__ = "ai_reports"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True)

    # Core scores
    trust_score = Column(Integer)
    default_probability = Column(Float)
    risk_category = Column(String)
    safe_loan_amount = Column(Float)
    anomaly_risk_pct = Column(Float)
    anomaly_flagged = Column(Boolean)

    # Ratios
    income_consistency = Column(Float)
    credit_debit_ratio = Column(Float)
    emi_to_income_ratio = Column(Float)

    # Full extracted data (JSON blobs for dashboard)
    txn_data = Column(JSON)
    cibil_data = Column(JSON)
    full_result = Column(JSON)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    application = relationship("Application", back_populates="ai_report")


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    file_type = Column(String)   # "transactions_csv" | "cibil_html"
    s3_key = Column(String)
    original_filename = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application", back_populates="uploaded_files")


class EMIOption(Base):
    __tablename__ = "emi_options"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    lender_id = Column(Integer, ForeignKey("lenders.id"), nullable=True)
    loan_amount = Column(Float)
    tenure_months = Column(Integer)
    interest_rate = Column(Float)
    monthly_emi = Column(Float)
    total_payable = Column(Float)
    total_interest = Column(Float)

    application = relationship("Application", back_populates="emi_options")


class BlockchainTransaction(Base):
    __tablename__ = "blockchain_transactions"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    tx_hash = Column(String, unique=True)
    action = Column(String)   # submitted | approved | rejected | modified
    data_hash = Column(String)
    block_number = Column(Integer, nullable=True)
    network = Column(String, default="polygon_mumbai")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application", back_populates="blockchain_txns")
