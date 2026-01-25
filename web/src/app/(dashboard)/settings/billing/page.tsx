'use client';

import { useEffect, useState } from 'react';
import { getUserSubscription, getUserInvoices, getCustomerPortalUrl, Subscription, Invoice } from '@/actions/billing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Download, ExternalLink, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
    const router = useRouter(); // Keep for potential navigation needs, though unused in effect now
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [portalUrl, setPortalUrl] = useState<string>('#');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [subData, invData, url] = await Promise.all([
                    getUserSubscription(),
                    getUserInvoices(),
                    getCustomerPortalUrl()
                ]);
                setSubscription(subData);
                setInvoices(invData);
                setPortalUrl(url);
            } catch (error) {
                console.error("Failed to load billing data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(amount / 100); // Assuming amount is in cents
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="space-y-4">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing & Plans</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your subscription and view billing history.
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Current Plan Card */}
                <Card className="bg-gradient-to-br from-card to-card/50 border-white/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Current Plan</span>
                            {subscription?.status === 'active' && (
                                <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                                    Active
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>Your current subscription details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold">{subscription?.product.name}</h3>
                            <p className="text-sm text-muted-foreground">{subscription?.product.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Renews on {formatDate(subscription?.current_period_end || '')}</span>
                        </div>
                        <div className="text-2xl font-semibold">
                            {subscription ? formatCurrency(subscription.price.amount, subscription.price.currency) : '-'}
                            <span className="text-sm font-normal text-muted-foreground">/{subscription?.price.interval}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full gap-2" variant="outline" onClick={() => window.open(portalUrl, '_blank')}>
                            Manage Subscription <ExternalLink className="w-4 h-4" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Payment Method Card */}
                <Card className="bg-card/50 backdrop-blur border-white/10">
                    <CardHeader>
                        <CardTitle>Payment Method</CardTitle>
                        <CardDescription>Manage your payment information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-background/50">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <CreditCard className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Visa ending in 4242</p>
                                <p className="text-sm text-muted-foreground">Expires 12/28</p>
                            </div>
                            <Badge variant="outline">Default</Badge>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="ghost" onClick={() => window.open(portalUrl, '_blank')}>
                            Update Payment Method
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Invoice History */}
            <Card className="bg-card/50 backdrop-blur border-white/10">
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>Download past invoices and receipts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium">
                                <tr>
                                    <th className="p-4">Invoice ID</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-t hover:bg-muted/50 transition-colors">
                                        <td className="p-4 font-medium">{invoice.id}</td>
                                        <td className="p-4">{formatDate(invoice.created_at)}</td>
                                        <td className="p-4">{formatCurrency(invoice.amount, invoice.currency)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {invoice.status === 'paid' ? (
                                                    <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">Paid</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/10">{invoice.status}</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(invoice.pdf_url || '#', '_blank')}>
                                                <Download className="w-4 h-4" />
                                                <span className="sr-only">Download Invoice</span>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No invoices found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
