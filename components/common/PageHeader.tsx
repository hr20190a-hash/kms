
import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => (
  <div className="mb-8">
    <h2 className="text-3xl font-bold text-pf-brown">{title}</h2>
    <p className="text-pf-brown/80 mt-1">{subtitle}</p>
  </div>
);

export default PageHeader;